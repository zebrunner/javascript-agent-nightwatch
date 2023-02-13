const ConfigResolver = require('../../config-resolver');
const { REPORTING_EVENTS } = require('./constants');
const { startIPCServer, stopIPCServer } = require('./ipc/server');
const { HttpClient, jsonHeaders } = require('../../api-client-axios');
const Storage = require('./storage');
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

  #storage;

  constructor(config) {
    this.#initIPCServer();

    this.#reporterConfig = config;
    this.#configResolver = new ConfigResolver(config);
    this.#httpClient = new HttpClient(this.#configResolver);
    this.#storage = new Storage();

    this.#accessToken = null;
    this.#runId = null;
    this.#testsMap = new Map();
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

      console.log(testStartBody, test);
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      this.#storage.createTestExecution(testStartBody.name);

      try {
        const { data } = await this.#httpClient.callPost(url, testStartBody, headers);

        this.#storage.addIdToTestExecution(data.id, data.name);
      } catch (e) {
        throw new Error();
      }
    }
  };

  #finishTest = async (test) => {
    console.log('FINISH TEST', test);

    console.log(this.#storage.getAllTestExecutions());

    const testExecutionId = this.#storage.getTestExecutionIdByName(test.title);

    if (testExecutionId) {
      const testEndBody = getTestEnd(test.result);

      if (test.reason) {
        testEndBody.reason = test.reason;
      }

      const url = API_URLS.URL_FINISH_TEST.replace('${testRunId}', this.runId).replace(
        '${testId}',
        testExecutionId,
      );
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      try {
        await this.#httpClient.callPut(url, testEndBody, headers);
      } catch (e) {
        throw new Error();
      }
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
      const headers = await this.#getHeadersWithAuth(jsonHeaders);

      await this.#httpClient.callPut(
        API_URLS.URL_FINISH_RUN.concat(this.runId),
        getTestRunEnd(),
        headers,
      );

      this.#terminateIPCServer();
    }
  };

  #getProjectKey() {
    return this.#configResolver.getReportingProjectKey()
      ? this.#configResolver.getReportingProjectKey()
      : 'DEF';
  }
}

module.exports = Reporter;
