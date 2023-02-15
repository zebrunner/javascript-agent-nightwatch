const fs = require('fs');
const ConfigResolver = require('../../config-resolver');
const { REPORTING_EVENTS } = require('./constants');
const { startIPCServer, stopIPCServer } = require('./ipc/server');
const { HttpClient, jsonHeaders } = require('../../api-client-axios');
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

  #storage;

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

      const testStartResponse = await this.#httpClient.callPost(url, testStartBody, headers);

      this.#testsMap.set(test.uniqueId, {
        promiseStart: testStartResponse,
        zbrTestId: testStartResponse.data.id,
      });
    }
  };

  #finishTest = async (test) => {
    if (this.#testsMap.get(test.uniqueId)) {
      const testId = this.#testsMap.get(test.uniqueId).zbrTestId;

      const testEndBody = getTestEnd(test.result);

      if (test.reason) {
        testEndBody.reason = test.reason;
      }

      this.#processAssertions(test);

      const url = API_URLS.URL_FINISH_TEST.replace('${testRunId}', this.runId).replace(
        '${testId}',
        testId,
      );
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      const testEndResponse = this.#httpClient.callPut(url, testEndBody, headers);

      this.#testsMap.get(test.uniqueId).promiseFinish = testEndResponse;
    }
  };

  #processAssertions = async (test) => {
    const testExecutionId = this.#storage.getTestExecutionIdByName(test.fullTitle);

    if (testExecutionId) {
      this.#sendLogs(testExecutionId, test.assertions);
    }
  };

  #sendLogs = async (testExecutionId, messages, level) => {
    const logsBody = messages.map((message, index) => ({
      testId: testExecutionId,
      message: message.fullMsg || message,
      level: level || (message.failure === false ? logLevels.INFO : logLevels.ERROR),
      timestamp: Date.now() + index,
    }));
    const url = API_URLS.URL_SEND_LOGS.replace('${testRunId}', this.runId);
    const headers = await this.#getHeadersWithAuth(jsonHeaders);

    const response = await this.#httpClient.callPost(url, logsBody, headers);

    this.#logsMap.set(testExecutionId, {
      promiseSendLogs: response,
    });
  };

  #sendScreenshot = async (testExecutionId, imgPath) => {
    const url = API_URLS.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runId).replace('${testId}', testExecutionId);
    const headers = await this.#getHeadersWithAuth(screenshotHeaders);

    const { httpClient } = this;

    if (imgPath?.length < 255) {
      const screenshotReadPromise = new Promise((resolve) => {
        fs.readFile(imgPath, (err, data) => {
          if (err) {
            throw err;
          }

          const response = httpClient.callPost(url, data, headers);

          this.#screenshotsMap.get(testExecutionId).screenshotSendPromise = response;

          resolve();
        });
      });

      this.#screenshotsMap.set(testExecutionId, {
        screenshotReadPromise,
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
    console.log('---FINISH_TEST_RUN_AGENT---');

    if (this.runId) {
      const finishPromisesArr = Array.from(this.#testsMap.values()).map((i) => i.promiseFinish);
      await Promise.all([...finishPromisesArr]);

      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      await this.#httpClient.callPut(
        API_URLS.URL_FINISH_RUN.concat(this.runId),
        getTestRunEnd(),
        headers,
      );

      this.#terminateIPCServer();
      process.exit(0);
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
