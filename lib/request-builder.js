const { v4: uuidv4 } = require('uuid');
const ConfigResolver = require('./config-resolver');

const API_URLS = {
  URL_REFRESH: '/api/iam/v1/auth/refresh',
  URL_REGISTER_RUN: '/api/reporting/v1/test-runs?projectKey=${project}',
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

module.exports = {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
};
