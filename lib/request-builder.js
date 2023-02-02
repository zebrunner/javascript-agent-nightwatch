const { v4: uuidv4 } = require('uuid');
const ConfigResolver = require('./config-resolver');

const API_URLS = {
  URL_REFRESH: '/api/iam/v1/auth/refresh',
  URL_REGISTER_RUN: '/api/reporting/v1/test-runs?projectKey=${project}',
  URL_FINISH_RUN: '/api/reporting/v1/test-runs/',
  URL_START_TEST: '/api/reporting/v1/test-runs/${testRunId}/tests',
};
const getRefreshToken = (token) => ({
  refreshToken: token,
});

const getTestRunStart = (reporterConfig, testRunUuid = null) => {
  const testRunStartBody = {
    uuid: testRunUuid || uuidv4(),
    name: '',
    startedAt: new Date(),
    framework: 'nightwatch',
    config: {},
  };

  const configResolver = new ConfigResolver(reporterConfig);

  if (configResolver.getReportingRunEnvironment()) {
    testRunStartBody.config.environment = configResolver.getReportingRunEnvironment();
  }

  if (configResolver.getReportingRunBuild()) {
    testRunStartBody.config.build = configResolver.getReportingRunBuild();
  }

  if (configResolver.getReportingRunDisplayName()) {
    testRunStartBody.name = configResolver.getReportingRunDisplayName();
  }

  return testRunStartBody;
};

const getTestRunEnd = () => ({
  endedAt: new Date(),
});

const getTestStart = (test) => {
  const testStartBody = {
    name: test.title,
    startedAt: new Date(),
    className: test.testFileName,
    methodName: test.parentTitle,
  };

  return testStartBody;
};

module.exports = {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
};
