const { HttpClient, jsonHeaders } = require('./api-client-axios');
const {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestStart,
  getTestEnd,
  getTestRunEnd,
} = require('./request-builder');
const { testStatuses, logLevels } = require('./constants');

class ZebrunnerApiClient {
  constructor(reporterConfig, configResolver) {
    this.reporterConfig = reporterConfig;
    this.configResolver = configResolver;
    this.httpClient = new HttpClient(configResolver);

    this.accessToken = null;

    this.testsMap = new Map();
  }

  async refreshToken() {
    if (!this.accessToken) {
      const res = await this.httpClient.callPost(
        API_URLS.URL_REFRESH,
        getRefreshToken(this.configResolver.getReportingServerAccessToken()),
        jsonHeaders.headers,
      );

      this.accessToken = `${res.data.authTokenType} ${res.data.authToken}`;
    }

    return this.accessToken;
  }

  async getHeadersWithAuth(basicHeaders) {
    const authToken = await this.refreshToken();

    if (authToken) {
      const authHeaders = basicHeaders.headers;
      authHeaders.Authorization = authToken;

      return authHeaders;
    }
  }

  async registerTestRunStart(testRunUuid) {
    console.log('REGISTER TEST RUN START');
    const headers = await this.getHeadersWithAuth(jsonHeaders);

    if (headers) {
      const testRunStartBody = getTestRunStart(this.reporterConfig, testRunUuid);

      return this.httpClient
        .callPost(
          API_URLS.URL_REGISTER_RUN.replace('${project}', this.getProjectKey()),
          testRunStartBody,
          headers,
        )
        .then((res) => {
          this.runId = res?.data?.id;
        });
    }
  }

  async registerTestRunFinish() {
    if (this.runId) {
      const headers = await this.getHeadersWithAuth(jsonHeaders);

      await this.httpClient.callPut(
        API_URLS.URL_FINISH_RUN.concat(this.runId),
        getTestRunEnd(),
        headers,
      );
    }
  }

  async startTest(test) {
    if (this.runId) {
      const url = API_URLS.URL_START_TEST.replace('${testRunId}', this.runId);
      const testStartBody = getTestStart(test);
      const headers = await this.getHeadersWithAuth(jsonHeaders);

      const testStartResponse = await this.httpClient.callPost(url, testStartBody, headers);

      this.testsMap.set(test.uniqueId, {
        promiseStart: testStartResponse,
        zbrTestId: testStartResponse.data.id,
      });

      console.log(`Test has been created with id = ${testStartResponse.data.id}`);
      return testStartResponse;
    }
  }

  async finishTest(test, status, reason) {
    if (this.testsMap.get(test.uniqueId)) {
      const testId = this.testsMap.get(test.uniqueId).zbrTestId;

      const testEndBody = getTestEnd(status);
      if (reason) {
        testEndBody.reason = reason;
        this.testsMap.get(test.uniqueId).state = testStatuses.FAILED;
      }
      const url = API_URLS.URL_FINISH_TEST.replace('${testRunId}', this.runId).replace('${testId}', testId);
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const testEndResponse = await this.httpClient.callPut(url, testEndBody, headers);
      this.testsMap.get(test.uniqueId).promiseFinish = testEndResponse;

      console.log(`Test with id = ${testId} has been finished with status ${status}`);
      return testEndResponse;
    }
  }

  async sendLogs(test, messages, level = logLevels.INFO) {
    if (this.testsMap.get(test.uniqueId)) {
      const testId = this.testsMap.get(test.uniqueId).zbrTestId;

      const logsBody = messages.map((m, index) => ({
        testId,
        message: m,
        level,
        timestamp: Date.now() + index,
      }));

      const url = API_URLS.URL_SEND_LOGS.replace('${testRunId}', this.runId);
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      return this.httpClient.callPost(url, logsBody, headers).then(() => {
        console.log(`Logs have been sent for test with id = ${testId}`);
      });
    }
  }

  async sendError(test, err) {
    const message = err.stack || err.message || err.toString();
    await this.sendLogs(test, message, logLevels.ERROR);
  }

  getProjectKey() {
    return this.configResolver.getReportingProjectKey()
      ? this.configResolver.getReportingProjectKey()
      : 'DEF';
  }
}

module.exports = ZebrunnerApiClient;
