const fs = require('fs');
const ConfigResolver = require('../../config-resolver');
const { REPORTING_EVENTS } = require('./constants');
const { startIPCServer, stopIPCServer } = require('./ipc/server');
const { logLevels, testStatuses } = require('../../constants');
const { getScreenshotByName } = require('../../utils');
const {
  parseNightwatchSkipTestInfo,
  getNightwatchTestInfoAsOneTest,
  combineTestCaseResults,
} = require('../../object-transformer');
const { HttpClient, jsonHeaders, imageHeaders } = require('../../api-client-axios');
const Storage = require('./storage');
const {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  getTestEnd,
  getTestSessionStart,
  getTestSessionUpdate,
  getTestSessionEnd,
} = require('../../request-builder');

class ZebrunnerReporter {
  #reporterConfig;

  #configResolver;

  #httpClient;

  #accessToken;

  #testSuitesMap;

  #testsMap;

  #testSessionsMap;

  #logsMap;

  #screenshotsMap;

  #testCasesFinishPromises;

  #storage;

  constructor(config) {
    this.#initIPCServer();

    this.#reporterConfig = config;
    this.#configResolver = new ConfigResolver(config);
    this.#httpClient = new HttpClient(this.#configResolver);
    this.#storage = new Storage();

    this.#accessToken = null;
    this.#testSuitesMap = new Map();
    this.#testsMap = new Map();
    this.#testSessionsMap = new Map();
    this.#logsMap = new Map();
    this.#screenshotsMap = new Map();
    this.#testCasesFinishPromises = [];
  }

  #initIPCServer = () => {
    startIPCServer(this.#subscribeServerEvents, this.#unsubscribeServerEvents);
  };

  #terminateIPCServer = () => {
    stopIPCServer(this.#unsubscribeServerEvents);
  };

  #subscribeServerEvents = (server) => {
    server.on(REPORTING_EVENTS.START_TEST_SESSION, this.#startTestSuite);
    server.on(REPORTING_EVENTS.FINISH_TEST_SESSION, this.#finishTestSuite);
    server.on(REPORTING_EVENTS.START_TEST, this.#startTest);
    server.on(REPORTING_EVENTS.FINISH_TEST, this.#finishTest);
  };

  // eslint-disable-next-line class-methods-use-this
  #unsubscribeServerEvents = (server) => {
    server.off(REPORTING_EVENTS.START_TEST_SESSION, '*');
    server.off(REPORTING_EVENTS.FINISH_TEST_SESSION, '*');
    server.off(REPORTING_EVENTS.START_TEST, '*');
    server.off(REPORTING_EVENTS.FINISH_TEST, '*');
  };

  #refreshToken = async () => {
    if (!this.#accessToken) {
      const res = await this.#httpClient.callPost(
        API_URLS.URL_REFRESH,
        getRefreshToken(this.#configResolver.getReportingServerAccessToken()),
        jsonHeaders.headers,
      );

      this.#accessToken = `${res.data.authTokenType} ${res.data.authToken}`;
    }

    return this.#accessToken;
  };

  #getHeadersWithAuth = async (basicHeaders) => {
    const authToken = await this.#refreshToken();

    if (authToken) {
      const authHeaders = basicHeaders.headers;
      authHeaders.Authorization = authToken;

      return authHeaders;
    }
  };

  #getSession = async (test) => {
    if (this.#testSuitesMap.get(test.moduleUniqueId).currentSession) {
      const { data } = await this.#testSuitesMap.get(test.moduleUniqueId).currentSession;

      return data;
    }
  };

  #getSessionId = async (test) => {
    const session = await this.#getSession(test);

    return session ? session.id : undefined;
  };

  #getTestUniqueId = (test) => (this.#testSuitesMap.get(test.moduleUniqueId).trackAsOneZbrTest
    ? test.moduleUniqueId
    : test.uniqueId);

  #skipTest = async (test, name) => {
    const skipTest = parseNightwatchSkipTestInfo(test, name);
    await this.#startTest(skipTest, false);
    await this.#finishTest(skipTest);
  };

  #startTest = async (test, processTestSession = true) => {
    if (this.#storage.runId) {
      const testInfo = (await test.trackAsOneZbrTest) ? getNightwatchTestInfoAsOneTest(test) : test;

      const url = API_URLS.URL_START_TEST.replace('${testRunId}', this.#storage.runId);

      const testStartBody = getTestStart(testInfo);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testStartPromise = this.#httpClient.callPost(url, testStartBody, headers);

      this.#testSuitesMap.get(testInfo.moduleUniqueId).trackAsOneZbrTest = testInfo.trackAsOneZbrTest;

      this.#storage.setTestStartPromise(this.#getTestUniqueId(test), testStartPromise);

      if (processTestSession) {
        await this.#processTestSession(testInfo);
      }
    }
  };

  /**
   * Called when test is started and checked existing browser session and current Zebrunner session:
   * - if Zebrunner session is not present, it will be created
   * - if current browser session is not the same as Zebrunner, it means that probably session was terminated in the end of previous test.
   * Previous session will be finished and new one started.
   */
  #processTestSession = async (test) => {
    const session = await this.#getSession(test);

    if (test.sessionId && !session) {
      await this.#startTestSession(test);
    }

    if (session && test.sessionId !== session.sessionId) {
      await this.#finishTestSession(test);
      await this.#startTestSession(test);
    }
  };

  #finishTest = async (test) => {
    const testUniqueId = this.#getTestUniqueId(test);

    let currentTest = this.#storage.getTestByUniqueId(testUniqueId);

    if (!currentTest) {
      await this.#startTest(test, false);
      currentTest = this.#storage.getTestByUniqueId(testUniqueId);
    }

    const testInfo = this.#testSuitesMap.get(test.moduleUniqueId).trackAsOneZbrTest
      ? combineTestCaseResults(test)
      : test;

    const testCaseFinishPromise = currentTest.startPromise.then(async ({ data }) => {
      this.#storage.setTestZbrId(testUniqueId, data.id);
      this.#storage.setTestStartedAt(testUniqueId, data.startedAt);

      if (testInfo.status !== testStatuses.SKIPPED) {
        await this.#linkTestAndTestSession(testInfo);

        if (testInfo.sessionId === null) {
          await this.#finishTestSession(testInfo);
        }

        if (testInfo.assertions) {
          await this.#processAssertions(data.id, data.startedAt, testInfo);
        }
      }

      const testEndBody = getTestEnd(testInfo.status);

      if (testInfo.reason) {
        testEndBody.reason = testInfo.reason;
      }

      const url = API_URLS.URL_FINISH_TEST.replace('${testRunId}', this.#storage.runId).replace(
        '${testId}',
        data.id,
      );

      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testFinishPromise = this.#httpClient.callPut(url, testEndBody, headers);

      this.#storage.setTestFinishPromise(testFinishPromise);
    });

    this.#testCasesFinishPromises.push(testCaseFinishPromise);
  };

  /**
   * Called when test case is finished and its results include assertions done in this test.
   * Those assertions are parsed here and sent to Zebrunner:
   * messages as logs and screenshots on failed test if any.
   */
  #processAssertions = async (testId, startedAt, test) => {
    const assertionsArr = test.assertions.map((obj, index) => ({
      ...obj,
      timestamp: new Date(startedAt).valueOf() + index * 100,
    }));

    const screenshotsArr = assertionsArr
      .filter((obj) => obj.screenshots)
      .map(({ screenshots, timestamp }) => ({ screenshots, timestamp }));

    await this.#sendLogs(testId, assertionsArr);

    screenshotsArr.forEach((screenshot) => {
      this.#sendScreenshot(
        testId,
        getScreenshotByName(screenshot.screenshots[0]),
        screenshot.timestamp,
      );
    });
  };

  #sendLogs = async (testId, messages, level) => {
    const logsBody = messages.map((message, index) => ({
      testId,
      message: message.fullMsg || message,
      level: level || (message.failure === false ? logLevels.INFO : logLevels.ERROR),
      timestamp: message.timestamp || Date.now() + index,
    }));
    const url = API_URLS.URL_SEND_LOGS.replace('${testRunId}', this.#storage.runId);
    const headers = await this.#getHeadersWithAuth(jsonHeaders);

    const response = await this.#httpClient.callPost(url, logsBody, headers);

    this.#logsMap.set(testId, {
      promiseSendLogs: response,
    });
  };

  #sendScreenshot = async (testId, imgPath, timestamp) => {
    const url = API_URLS.URL_SEND_SCREENSHOT.replace('${testRunId}', this.#storage.runId).replace(
      '${testId}',
      testId,
    );

    const httpClient = this.#httpClient;

    if (imgPath?.length < 255) {
      const promiseScreenshotRead = new Promise((resolve) => {
        fs.readFile(imgPath, async (err, data) => {
          if (err) {
            throw err;
          }
          const headers = await this.#getHeadersWithAuth(imageHeaders);
          const screenshotHeader = 'x-zbr-screenshot-captured-at';
          headers[screenshotHeader] = timestamp;
          const response = httpClient.callPost(url, data, headers);

          this.#screenshotsMap.get(testId).promiseScreenshotSend = response;

          resolve();
        });
      });

      this.#screenshotsMap.set(testId, {
        promiseScreenshotRead,
      });
    }
  };

  #startTestSession = async (test) => {
    if (this.#storage.runId) {
      const url = API_URLS.URL_START_SESSION.replace('${testRunId}', this.#storage.runId);

      const sessionStartBody = getTestSessionStart(test);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const sessionStartResponse = this.#httpClient.callPost(url, sessionStartBody, headers);
      this.#testSuitesMap.get(test.moduleUniqueId).currentSession = sessionStartResponse;
    }
  };

  #linkTestAndTestSession = async (test) => {
    const sessionId = await this.#getSessionId(test);

    if (this.#storage.runId && sessionId) {
      const url = API_URLS.URL_UPDATE_SESSION.replace('${testRunId}', this.#storage.runId).replace(
        '${testSessionId}',
        sessionId,
      );

      const testId = this.#storage.getTestByUniqueId(this.#getTestUniqueId(test)).zbrId;

      const sessionUpdateBody = getTestSessionUpdate([testId]);

      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const sessionUpdatePromise = this.#httpClient.callPut(url, sessionUpdateBody, headers);

      this.#storage.setTestZbrSessionId(sessionId);
      this.#testSessionsMap.set(sessionId, {
        promiseLinkTest: sessionUpdatePromise,
      });
    }
  };

  #finishTestSession = async (test) => {
    const sessionId = await this.#getSessionId(test);

    if (this.#storage.runId && sessionId) {
      const linkSessionPromisesArr = Array.from(this.#testSessionsMap.values()).map(
        (i) => i.promiseLinkTest,
      );
      await Promise.all(linkSessionPromisesArr);

      const url = API_URLS.URL_FINISH_SESSION.replace('${testRunId}', this.#storage.runId).replace(
        '${testSessionId}',
        sessionId,
      );

      const sessionEndBody = getTestSessionEnd();
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const sessionFinishResponse = this.#httpClient.callPut(url, sessionEndBody, headers);

      this.#testSuitesMap.get(test.moduleUniqueId).currentSession = null;

      if (this.#testSessionsMap.has(sessionId)) {
        this.#testSessionsMap.get(sessionId).promiseFinish = sessionFinishResponse;
      } else {
        this.#testSessionsMap.set(sessionId, {
          promiseFinish: sessionFinishResponse,
        });
      }
    }
  };

  /** Called before a whole test suite (test file) and includes beginning of test session */
  #startTestSuite = async (testSuite) => {
    this.#testSuitesMap.set(testSuite.moduleUniqueId, {});

    if (testSuite.sessionId) {
      await this.#startTestSession(testSuite);
    }
  };

  /**
   * Called right after a whole test suite (test file) and include:
   * - finishing of test session
   * - skipped tests processing
   */
  #finishTestSuite = async (testSuite) => {
    if (testSuite.sessionId) {
      await this.#finishTestSession(testSuite);
    }

    // when test case fails, the rest are skipped and displayed in currentTest.results.steps
    // process them when test file (suite) is finished
    if (!this.#testSuitesMap.get(testSuite.moduleUniqueId).trackAsOneZbrTest && testSuite.steps) {
      testSuite.steps.forEach(async (step) => {
        await this.#skipTest(testSuite, step);
      });
    }
  };

  #initializeRunContext = async () => {
    const runContext = this.#configResolver.getReportingRunContext();

    if (runContext) {
      const headers = await this.#getHeadersWithAuth(jsonHeaders);
      const { data } = await this.#httpClient.callPost(
        API_URLS.URL_EXCHANGE_RUN_CONTEXT,
        runContext,
        headers,
      );

      if (!data.runAllowed) {
        throw new Error(`Zebrunner Reporting is not allowed. Reason: ${data.reason}`);
      }

      return data.testRunUuid;
    }
  };

  startTestRun = async () => {
    const testRunUuid = await this.#initializeRunContext();
    const headers = await this.#getHeadersWithAuth(jsonHeaders);

    if (headers) {
      const testRunStartBody = getTestRunStart(this.#reporterConfig, testRunUuid);
      const projectKey = this.#configResolver.getReportingProjectKey();

      const { data } = await this.#httpClient.callPost(
        API_URLS.URL_REGISTER_RUN.replace('${project}', projectKey),
        testRunStartBody,
        headers,
      );

      this.#storage.runId = data.id;
    }
  };

  finishTestRun = async () => {
    await Promise.all(this.#testCasesFinishPromises);

    if (this.#storage.runId) {
      await Promise.all(this.#storage.getAllTestsStartPromises());

      const finishSessionPromisesArr = Array.from(this.#testSessionsMap.values()).map(
        (i) => i.promiseFinish,
      );
      const sendLogsPromisesArr = Array.from(this.#logsMap.values()).map((i) => i.promiseSendLogs);
      const screenshotsReadFilePromisesArr = Array.from(this.#screenshotsMap.values()).map(
        (i) => i.promiseScreenshotRead,
      );

      await Promise.all([
        ...this.#storage.getAllTestsFinishPromises(),
        ...finishSessionPromisesArr,
        ...sendLogsPromisesArr,
        ...screenshotsReadFilePromisesArr,
      ]);

      if (screenshotsReadFilePromisesArr.length) {
        const screenshotsSendPromisesArr = Array.from(this.#screenshotsMap.values()).map(
          (i) => i.promiseScreenshotSend,
        );

        await Promise.all(screenshotsSendPromisesArr);
      }

      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      await this.#httpClient.callPut(
        API_URLS.URL_FINISH_RUN.concat(this.#storage.runId),
        getTestRunEnd(),
        headers,
      );

      this.#terminateIPCServer();
    }
  };
}

process.on('exit', () => {
  // console.log('----- Nightwatch running is done -----');
  process.exit(0);
});

process.on('SIGINT', () => {
  // console.log('----- Caught interrupt signal -----');
  process.exit(1);
});

// workaround for ctrl+C handling on Win platform
if (process.platform === 'win32') {
  // eslint-disable-next-line global-require
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', () => {
    console.log('----- Caught interrupt signal (Windows) -----');
  });
}

module.exports = ZebrunnerReporter;
