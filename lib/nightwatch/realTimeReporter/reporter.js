const fs = require('fs');
const ConfigResolver = require('../../config-resolver');
const { REPORTING_EVENTS } = require('./constants');
const { startIPCServer, stopIPCServer } = require('./ipc/server');
const { logLevels } = require('../../constants');
const { getScreenshotByName } = require('../../utils');
const { HttpClient, jsonHeaders, imageHeaders } = require('../../api-client-axios');
const {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  getTestEnd,
} = require('../../request-builder');

class Reporter {
  #reporterConfig;

  #configResolver;

  #httpClient;

  #accessToken;

  #runId;

  #testsMap;

  #logsMap;

  #screenshotsMap;

  constructor(config) {
    this.#initIPCServer();

    this.#reporterConfig = config;
    this.#configResolver = new ConfigResolver(config);
    this.#httpClient = new HttpClient(this.#configResolver);

    this.#accessToken = null;
    this.#runId = null;
    this.#testsMap = new Map();
    this.#logsMap = new Map();
    this.#screenshotsMap = new Map();
  }

  #initIPCServer = () => {
    startIPCServer(this.#subscribeServerEvents, this.#unsubscribeServerEvents);
  };

  #terminateIPCServer = () => {
    stopIPCServer(this.#unsubscribeServerEvents);
  };

  #subscribeServerEvents = (server) => {
    server.on(REPORTING_EVENTS.START_TEST, this.#startTest);
    server.on(REPORTING_EVENTS.FINISH_TEST, this.#finishTest);
  };

  // eslint-disable-next-line class-methods-use-this
  #unsubscribeServerEvents = (server) => {
    server.off(REPORTING_EVENTS.START_TEST, '*');
    server.off(REPORTING_EVENTS.FINISH_TEST, '*');
  };

  #refreshToken = async () => {
    if (!this.accessToken) {
      const res = await this.#httpClient.callPost(
        API_URLS.URL_REFRESH,
        getRefreshToken(this.#configResolver.getReportingServerAccessToken()),
        jsonHeaders.headers,
      );

      this.accessToken = `${res.data.authTokenType} ${res.data.authToken}`;
    }

    return this.accessToken;
  };

  #getHeadersWithAuth = async (basicHeaders) => {
    const authToken = await this.#refreshToken();

    if (authToken) {
      const authHeaders = basicHeaders.headers;
      authHeaders.Authorization = authToken;

      return authHeaders;
    }
  };

  #startTest = async (test) => {
    if (this.runId) {
      const url = API_URLS.URL_START_TEST.replace('${testRunId}', this.runId);

      const testStartBody = getTestStart(test);

      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testStartResponse = this.#httpClient.callPost(url, testStartBody, headers);

      this.#testsMap.set(test.uniqueId, {
        promiseStart: testStartResponse,
      });
    }
  };

  #finishTest = async (test) => {
    const currentTest = this.#testsMap.get(test.uniqueId);

    currentTest.promiseStart.then(async ({ data }) => {
      currentTest.zbrTestId = data.id;

      await this.#processAssertions(data.id, test);

      const testEndBody = getTestEnd(test.status);

      if (test.reason) {
        testEndBody.reason = test.reason;
      }

      const url = API_URLS.URL_FINISH_TEST.replace('${testRunId}', this.runId).replace(
        '${testId}',
        data.id,
      );
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testEndResponse = this.#httpClient.callPut(url, testEndBody, headers);
      this.#testsMap.get(test.uniqueId).promiseFinish = testEndResponse;
    });
  };

  #processAssertions = async (testId, test) => {
    const assertionsArr = test.assertions.map((obj, index) => ({
      ...obj,
      timestamp: Date.now() + index,
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
    const url = API_URLS.URL_SEND_LOGS.replace('${testRunId}', this.runId);
    const headers = await this.#getHeadersWithAuth(jsonHeaders);

    const response = await this.#httpClient.callPost(url, logsBody, headers);

    this.#logsMap.set(testId, {
      promiseSendLogs: response,
    });
  };

  #sendScreenshot = async (testId, imgPath, timestamp) => {
    const url = API_URLS.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runId).replace(
      '${testId}',
      testId,
    );
    const headers = await this.#getHeadersWithAuth(imageHeaders);
    const screenshotHeader = 'x-zbr-screenshot-captured-at';
    headers[screenshotHeader] = timestamp;

    const httpClient = this.#httpClient;

    if (imgPath?.length < 255) {
      const promiseScreenshotRead = new Promise((resolve) => {
        fs.readFile(imgPath, (err, data) => {
          if (err) {
            throw err;
          }
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

  startTestRun = async () => {
    console.log('---START_TEST_RUN_AGENT---');

    const headers = await this.#getHeadersWithAuth(jsonHeaders);

    if (headers) {
      const testRunStartBody = getTestRunStart(this.#reporterConfig);

      const { data } = await this.#httpClient.callPost(
        API_URLS.URL_REGISTER_RUN.replace('${project}', this.#getProjectKey()),
        testRunStartBody,
        headers,
      );

      this.runId = data.id;
    }
  };

  finishTestRun = async () => {
    if (this.runId) {
      const finishPromisesArr = Array.from(this.#testsMap.values()).map((i) => i.promiseFinish);
      const sendLogsPromisesArr = Array.from(this.#logsMap.values()).map((i) => i.promiseSendLogs);
      const screenshotsReadFilePromisesArr = Array.from(this.#screenshotsMap.values()).map(
        (i) => i.promiseScreenshotRead,
      );

      await Promise.all([
        ...finishPromisesArr,
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
        API_URLS.URL_FINISH_RUN.concat(this.runId),
        getTestRunEnd(),
        headers,
      );

      this.#terminateIPCServer();
      // TODO: temporary commented, need to fix
      // process.exit(0);
    }
  };

  #getProjectKey() {
    return this.#configResolver.getReportingProjectKey()
      ? this.#configResolver.getReportingProjectKey()
      : 'DEF';
  }
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

module.exports = Reporter;
