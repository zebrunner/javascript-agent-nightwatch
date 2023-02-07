const fs = require('fs');
const { HttpClient, jsonHeaders, screenshotHeaders } = require('./api-client-axios');
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
    this.logsMap = new Map();
    this.screenshotsMap = new Map();
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

      const finishPromisesArr = Array.from(this.testsMap.values()).map((i) => i.promiseFinish);
      const sendLogsPromisesArr = Array.from(this.logsMap.values()).map((i) => i.promiseSendLogs);
      const screenshotsReadFilePromisesArr = Array.from(this.screenshotsMap.values()).map((i) => i.screenshotReadPromise);

      await Promise.all([...finishPromisesArr, ...sendLogsPromisesArr, ...screenshotsReadFilePromisesArr]);

      if (screenshotsReadFilePromisesArr.length) {
        const screenshotsSendPromisesArr = Array.from(this.screenshotsMap.values()).map((i) => i.screenshotSendPromise);

        await Promise.all(screenshotsSendPromisesArr);
      }

      return this.httpClient.callPut(
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
      const url = API_URLS.URL_FINISH_TEST.replace('${testRunId}', this.runId).replace(
        '${testId}',
        testId,
      );
      const headers = await this.getHeadersWithAuth(jsonHeaders);
      const testEndResponse = this.httpClient.callPut(url, testEndBody, headers);
      this.testsMap.get(test.uniqueId).promiseFinish = testEndResponse;

      console.log(`Test with id = ${testId} has been finished with status ${status}`);

      return testEndResponse;
    }
  }

  async skipTest(test) {
    if (!this.testsMap.get(test.uniqueId)) {
      await this.startTest(test);
    }

    await this.finishTest(test, testStatuses.SKIPPED);
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

      const sendLogsResponse = this.httpClient.callPost(url, logsBody, headers);

      this.logsMap.set(test.uniqueId, {
        promiseSendLogs: sendLogsResponse,
      });
    }
  }

  async sendScreenshot(test, imgPath) {
    if (this.testsMap.get(test.uniqueId)) {
      const testId = this.testsMap.get(test.uniqueId).zbrTestId;

      const url = API_URLS.URL_SEND_SCREENSHOT.replace('${testRunId}', this.runId).replace(
        '${testId}',
        testId,
      );
      const headers = await this.getHeadersWithAuth(screenshotHeaders);

      const { httpClient } = this;

      if (imgPath?.length < 255) {
        console.log('BEFORE FILE READ');

        const screenshotReadPromise = new Promise((resolve) => {
          fs.readFile(imgPath, (err, data) => {
            if (err) {
              throw err;
            }

            const screenshotResponse = httpClient.callPost(url, data, headers);

            this.screenshotsMap.get(test.uniqueId).screenshotSendPromise = screenshotResponse;

            resolve();
          });
        });

        this.screenshotsMap.set(test.uniqueId, {
          screenshotReadPromise,
        });
      }
    }
  }

  // async sendError(test, message) {
  //   await this.sendLogs(test, message, logLevels.ERROR);
  // }

  getProjectKey() {
    return this.configResolver.getReportingProjectKey()
      ? this.configResolver.getReportingProjectKey()
      : 'DEF';
  }
}

module.exports = ZebrunnerApiClient;
