const { HttpClient, jsonHeaders } = require('./api-client-axios');
const {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestStart,
  getTestRunEnd,
} = require('./request-builder');

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

      return testStartResponse;
    }
  }

  getProjectKey() {
    return this.configResolver.getReportingProjectKey()
      ? this.configResolver.getReportingProjectKey()
      : 'DEF';
  }
}

module.exports = ZebrunnerApiClient;
