const fs = require('fs');
const ConfigResolver = require('../../config-resolver');
const { REPORTING_EVENTS } = require('./constants');
const { startIPCServer, stopIPCServer } = require('./ipc/server');
const { logLevels, testStatuses, LOCALE } = require('../../constants');
const { getScreenshotByName, generateMultipartBoundary } = require('../../utils');
const {
  parseNightwatchSkipTestInfo,
  getNightwatchTestInfoAsOneTest,
  combineTestCaseResults,
} = require('../../object-transformer');
const {
  HttpClient, jsonHeaders, imageHeaders, multipartDataHeaders, buildMultiPartStream,
} = require('../../api-client-axios');
const Storage = require('./storage');
const {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  setMaintainer,
  getTestEnd,
  getTestSessionStart,
  getTestSessionUpdate,
  getTestSessionEnd,
  getAttachLabels,
  getAttachArtifactReferences,
} = require('../../request-builder');

class ZebrunnerReporter {
  #reporterConfig;

  #configResolver;

  #httpClient;

  #accessToken;

  #storage;

  constructor(config) {
    this.#initIPCServer();

    this.#reporterConfig = config;
    this.#configResolver = new ConfigResolver(config);
    this.#httpClient = new HttpClient(this.#configResolver);
    this.#storage = new Storage();

    this.#accessToken = null;
  }

  #initIPCServer = () => {
    startIPCServer(this.#subscribeServerEvents, this.#unsubscribeServerEvents);
  };

  #terminateIPCServer = () => {
    stopIPCServer(this.#unsubscribeServerEvents);
  };

  #waitForTestStartPromises = async () => {
    await Promise.all(this.#storage.testCasesStartPromises);
  };

  #subscribeServerEvents = (server) => {
    server.on(REPORTING_EVENTS.START_TEST_SESSION, this.#startTestSuite);
    server.on(REPORTING_EVENTS.FINISH_TEST_SESSION, this.#finishTestSuite);
    server.on(REPORTING_EVENTS.START_TEST, async (message) => {
      // necessary to save startTest promise in case of tracking additional artifacts for test
      this.#storage.addTestCaseStartPromise(this.#startTest(message));
    });
    server.on(REPORTING_EVENTS.FINISH_TEST, this.#finishTest);
    server.on(REPORTING_EVENTS.ATTACH_TEST_RUN_LABELS, this.#attachTestRunLabels);
    server.on(REPORTING_EVENTS.ATTACH_TEST_RUN_ARTIFACT_REFERENCES, this.#attachTestRunArtifactReferences);
    server.on(REPORTING_EVENTS.UPLOAD_TEST_RUN_ARTIFACT, this.#uploadTestRunArtifact);
    server.on(REPORTING_EVENTS.ATTACH_TEST_LABELS, async (message) => {
      await this.#waitForTestStartPromises();
      this.#attachTestLabels(message);
    });
    server.on(REPORTING_EVENTS.ATTACH_TEST_ARTIFACT_REFERENCES, async (message) => {
      await this.#waitForTestStartPromises();
      this.#attachTestArtifactReferences(message);
    });
    server.on(REPORTING_EVENTS.UPLOAD_TEST_ARTIFACT, async (message) => {
      await this.#waitForTestStartPromises();
      this.#uploadTestArtifact(message);
    });
    server.on(REPORTING_EVENTS.SET_TEST_MAINTAINER, async (message) => {
      await this.#waitForTestStartPromises();
      this.#setTestMaintainer(message);
    });
    server.on(REPORTING_EVENTS.REVERT_TEST_REGISTRATION, async (message) => {
      await this.#waitForTestStartPromises();
      this.#revertTestRegistration(message);
    });
  };

  // eslint-disable-next-line class-methods-use-this
  #unsubscribeServerEvents = (server) => {
    server.off(REPORTING_EVENTS.START_TEST_SESSION, '*');
    server.off(REPORTING_EVENTS.FINISH_TEST_SESSION, '*');
    server.off(REPORTING_EVENTS.START_TEST, '*');
    server.off(REPORTING_EVENTS.FINISH_TEST, '*');
    server.off(REPORTING_EVENTS.ATTACH_TEST_RUN_LABELS, '*');
    server.off(REPORTING_EVENTS.ATTACH_TEST_RUN_ARTIFACT_REFERENCES, '*');
    server.off(REPORTING_EVENTS.UPLOAD_TEST_RUN_ARTIFACT, '*');
    server.off(REPORTING_EVENTS.ATTACH_TEST_LABELS, '*');
    server.off(REPORTING_EVENTS.ATTACH_TEST_ARTIFACT_REFERENCES, '*');
    server.off(REPORTING_EVENTS.UPLOAD_TEST_ARTIFACT, '*');
    server.off(REPORTING_EVENTS.SET_TEST_MAINTAINER, '*');
    server.off(REPORTING_EVENTS.REVERT_TEST_REGISTRATION, '*');
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
    if (this.#storage.getTestSuiteByUniqueId(test.moduleUniqueId).sessionStartPromise) {
      const { data } = await this.#storage.getTestSuiteByUniqueId(test.moduleUniqueId).sessionStartPromise;

      return data;
    }
  };

  #getSessionId = async (test) => {
    const session = await this.#getSession(test);

    return session ? session.id : undefined;
  };

  #getTestUniqueId = (test) => (this.#storage.getTestSuiteByUniqueId(test.moduleUniqueId).trackAsOneZbrTest
    ? test.moduleUniqueId
    : test.uniqueId);

  #skipTest = async (test, name) => {
    const skipTest = parseNightwatchSkipTestInfo(test, name);
    await this.#startTest(skipTest, false);
    await this.#finishTest(skipTest);
  };

  #startTest = async (test, processTestSession = true) => {
    if (this.#storage.runId) {
      const testInfo = test.trackAsOneZbrTest ? getNightwatchTestInfoAsOneTest(test) : test;

      const url = API_URLS.URL_START_TEST.replace('${testRunId}', this.#storage.runId);

      const testStartBody = getTestStart(testInfo);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testStartPromise = this.#httpClient.callPost(url, testStartBody, headers);

      this.#storage.setTestSuiteTrackAsOneZbrTest(testInfo.moduleUniqueId, testInfo.trackAsOneZbrTest);
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
      // probably test failed in before/beforeEach hook and has not been started yet
      await this.#startTest(test, false);
      currentTest = this.#storage.getTestByUniqueId(testUniqueId);
    }

    if (currentTest.revertPromise) {
      // test registration has been reverted, nothing to finish
      await currentTest.revertPromise;

      return;
    }

    const testInfo = this.#storage.getTestSuiteByUniqueId(test.moduleUniqueId).trackAsOneZbrTest
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

      if (currentTest.updatePromise) {
        await currentTest.updatePromise;
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

      this.#storage.setTestFinishPromise(testUniqueId, testFinishPromise);
    });

    this.#storage.addTestCaseFinishPromise(testCaseFinishPromise);
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

    const sendLogsPromise = this.#httpClient.callPost(url, logsBody, headers);

    this.#storage.setLogs(testId, sendLogsPromise);
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

          const sendScreenShotPromise = httpClient.callPost(url, data, headers);

          this.#storage.setScreenshotSendPromise(testId, sendScreenShotPromise);

          resolve();
        });
      });

      this.#storage.setScreenshot(testId, promiseScreenshotRead);
    }
  };

  #startTestSession = async (test) => {
    if (this.#storage.runId) {
      const url = API_URLS.URL_START_SESSION.replace('${testRunId}', this.#storage.runId);

      const sessionStartBody = getTestSessionStart(test);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const sessionStartPromise = this.#httpClient.callPost(url, sessionStartBody, headers);

      this.#storage.setTestSuiteSessionStartPromise(test.moduleUniqueId, sessionStartPromise);
    }
  };

  #linkTestAndTestSession = async (test) => {
    const sessionId = await this.#getSessionId(test);

    if (this.#storage.runId && sessionId) {
      const url = API_URLS.URL_UPDATE_SESSION.replace('${testRunId}', this.#storage.runId).replace(
        '${testSessionId}',
        sessionId,
      );

      const testId = await this.#storage.getTestZbrId(this.#getTestUniqueId(test));

      const sessionUpdateBody = getTestSessionUpdate([testId]);

      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const sessionUpdatePromise = this.#httpClient.callPut(url, sessionUpdateBody, headers);

      this.#storage.setTestZbrSessionId(this.#getTestUniqueId(test), sessionId);
      this.#storage.setTestSession(sessionId, sessionUpdatePromise);
    }
  };

  #finishTestSession = async (test) => {
    const sessionId = await this.#getSessionId(test);

    if (this.#storage.runId && sessionId) {
      await Promise.all(this.#storage.getAllTestSessionsUpdatePromises());

      const url = API_URLS.URL_FINISH_SESSION.replace('${testRunId}', this.#storage.runId).replace(
        '${testSessionId}',
        sessionId,
      );

      const sessionEndBody = getTestSessionEnd();
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const sessionFinishResponse = this.#httpClient.callPut(url, sessionEndBody, headers);

      this.#storage.setTestSuiteSessionStartPromise(test.moduleUniqueId, null);
      this.#storage.setTestSessionFinishPromise(sessionId, sessionFinishResponse);
    }
  };

  /** Called before a whole test suite (test file) execution and includes beginning of test session */
  #startTestSuite = async (testSuite) => {
    this.#storage.setTestSuite(testSuite.moduleUniqueId);

    if (testSuite.sessionId) {
      await this.#startTestSession(testSuite);
    }
  };

  /**
   * Called right after a whole test suite (test file) is finished and include:
   * - finishing of test session
   * - skipped tests processing
   */
  #finishTestSuite = async (testSuite) => {
    if (testSuite.sessionId) {
      await this.#finishTestSession(testSuite);
    }

    // when test case fails, the rest are skipped and displayed in currentTest.results.steps
    // process them when test file (suite) is finished
    if (!this.#storage.getTestSuiteByUniqueId(testSuite.moduleUniqueId).trackAsOneZbrTest && testSuite.steps) {
      const skipTestsPromises = testSuite.steps.map((test) => this.#skipTest(testSuite, test));
      await Promise.all(skipTestsPromises);
    }
  };

  /**
   * Called before start of test run to understand if execution from Launcher or not
   * @returns testRunUuid
   */
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

  #startTestRun = async (testRunUuid) => {
    const testRunStartBody = getTestRunStart(this.#reporterConfig, testRunUuid);
    const projectKey = this.#configResolver.getReportingProjectKey();
    const headers = await this.#getHeadersWithAuth(jsonHeaders);

    const { data } = await this.#httpClient.callPost(
      API_URLS.URL_START_RUN.replace('${project}', projectKey),
      testRunStartBody,
      headers,
    );

    this.#storage.runId = data.id;
  };

  startTestRun = async () => {
    const testRunUuid = await this.#initializeRunContext();
    await this.#startTestRun(testRunUuid);
    await this.#saveTestRunLabels();
    await this.#saveTestRunArtifactReferences();
  };

  finishTestRun = async () => {
    await Promise.all(this.#storage.testCasesFinishPromises);

    if (this.#storage.runId) {
      await Promise.all(this.#storage.getAllTestsStartPromises());

      await Promise.all([
        ...this.#storage.getAllTestsFinishPromises(),
        ...this.#storage.getAllTestSessionsFinishPromises(),
        ...this.#storage.getAllSendLogsPromises(),
        ...this.#storage.getAllScreenshotsReadPromises(),
        ...this.#storage.artifactsFinishPromises,
      ]);

      if (this.#storage.getAllScreenshotsReadPromises().length) {
        await Promise.all(this.#storage.getAllScreenshotsSendPromises());
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

  #saveTestRunLabels = async () => {
    const labels = this.#configResolver.getReportingRunLabels();
    const locale = this.#configResolver.getReportingRunLocale();

    if (locale) {
      labels.push({
        key: LOCALE,
        value: locale,
      });
    }
    await this.#attachTestRunLabels(labels);
  };

  #saveTestRunArtifactReferences = async () => {
    const artifactReferences = this.#configResolver.getReportingRunArtifactReferences();
    await this.#attachTestRunArtifactReferences(artifactReferences);
  };

  #attachTestRunLabels = async (labels) => {
    if (this.#storage.runId && labels && labels.length !== 0) {
      const url = API_URLS.URL_ATTACH_TEST_RUN_LABELS.replace('${testRunId}', this.#storage.runId);
      const attachLabelsBody = getAttachLabels(labels);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);
      const attachLabelsPromise = this.#httpClient.callPut(url, attachLabelsBody, headers);

      this.#storage.addArtifactFinishPromise(attachLabelsPromise);
    }
  };

  #attachTestRunArtifactReferences = async (references) => {
    if (this.#storage.runId && references && references.length !== 0) {
      const url = API_URLS.URL_ATTACH_TEST_RUN_ARTIFACT_REFERENCES.replace('${testRunId}', this.#storage.runId);
      const attachReferencesBody = getAttachArtifactReferences(references);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);
      const attachReferencesPromise = this.#httpClient.callPut(url, attachReferencesBody, headers);

      this.#storage.addArtifactFinishPromise(attachReferencesPromise);
    }
  };

  #uploadTestRunArtifact = async (file) => {
    if (this.#storage.runId && file) {
      const url = API_URLS.URL_UPLOAD_TEST_RUN_ARTIFACT.replace('${testRunId}', this.#storage.runId);
      const boundary = generateMultipartBoundary();
      const attachArtifactMultipartBody = buildMultiPartStream(file.name, file, boundary);
      const headers = await this.#getHeadersWithAuth(multipartDataHeaders(boundary));

      const uploadArtifactPromise = this.#httpClient.callPost(url, attachArtifactMultipartBody, headers);

      this.#storage.addArtifactFinishPromise(uploadArtifactPromise);
    }
  };

  #attachTestLabels = async (message) => {
    const { test, labels } = message;
    const testId = await this.#storage.getTestZbrId(this.#getTestUniqueId(test));

    if (testId && labels && labels.length !== 0) {
      const url = API_URLS.URL_ATTACH_TEST_LABELS.replace('${testRunId}', this.#storage.runId).replace('${testId}', testId);
      const attachLabelsBody = getAttachLabels(labels);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);
      const attachLabelsPromise = this.#httpClient.callPut(url, attachLabelsBody, headers);

      this.#storage.addArtifactFinishPromise(attachLabelsPromise);
    }
  };

  #attachTestArtifactReferences = async (message) => {
    const { test, references } = message;
    const testId = await this.#storage.getTestZbrId(this.#getTestUniqueId(test));

    if (testId && references && references.length !== 0) {
      const url = API_URLS.URL_ATTACH_TEST_ARTIFACT_REFERENCES.replace('${testRunId}', this.#storage.runId).replace('${testId}', testId);
      const attachReferencesBody = getAttachArtifactReferences(references);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);
      const attachReferencesPromise = this.#httpClient.callPut(url, attachReferencesBody, headers);

      this.#storage.addArtifactFinishPromise(attachReferencesPromise);
    }
  };

  #uploadTestArtifact = async (message) => {
    const { test, file } = message;
    const testId = await this.#storage.getTestZbrId(this.#getTestUniqueId(test));

    if (testId && file) {
      const url = API_URLS.URL_UPLOAD_TEST_ARTIFACT.replace('${testRunId}', this.#storage.runId).replace('${testId}', testId);
      const boundary = generateMultipartBoundary();
      const attachArtifactMultipartBody = buildMultiPartStream(file.name, file, boundary);
      const headers = await this.#getHeadersWithAuth(multipartDataHeaders(boundary));

      const uploadArtifactPromise = this.#httpClient.callPost(url, attachArtifactMultipartBody, headers);

      this.#storage.addArtifactFinishPromise(uploadArtifactPromise);
    }
  };

  #setTestMaintainer = async (message) => {
    const { test, maintainer } = message;
    const testId = await this.#storage.getTestZbrId(this.#getTestUniqueId(test));

    if (testId && maintainer) {
      const url = API_URLS.URL_UPDATE_TEST.replace('${testRunId}', this.#storage.runId).replace('${testId}', testId);
      const setMaintainerBody = setMaintainer(maintainer);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testUpdatePromise = this.#httpClient.callPatch(url, setMaintainerBody, headers);

      this.#storage.setTestUpdatePromise(this.#getTestUniqueId(test), testUpdatePromise);
    }
  };

  #revertTestRegistration = async (message) => {
    const { test } = message;
    const testId = await this.#storage.getTestZbrId(this.#getTestUniqueId(test));

    if (testId) {
      const url = API_URLS.URL_REVERT_TEST_REGISTRATION.replace('${testRunId}', this.#storage.runId).replace('${testId}', testId);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testRevertPromise = this.#httpClient.callDelete(url, headers);

      this.#storage.setTestRevertPromise(this.#getTestUniqueId(test), testRevertPromise);
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
