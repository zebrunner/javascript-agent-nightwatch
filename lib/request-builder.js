const { v4: uuidv4 } = require('uuid');
const { testSessionStatuses } = require('./constants');
const ConfigResolver = require('./config-resolver');

const API_URLS = {
  URL_REFRESH: '/api/iam/v1/auth/refresh',
  URL_REGISTER_RUN: '/api/reporting/v1/test-runs?projectKey=${project}',
  URL_FINISH_RUN: '/api/reporting/v1/test-runs/',
  URL_START_TEST: '/api/reporting/v1/test-runs/${testRunId}/tests',
  URL_FINISH_TEST: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}',
  URL_START_SESSION: '/api/reporting/v1/test-runs/${testRunId}/test-sessions',
  URL_UPDATE_SESSION: '/api/reporting/v1/test-runs/${testRunId}/test-sessions/${testSessionId}',
  URL_FINISH_SESSION: '/api/reporting/v1/test-runs/${testRunId}/test-sessions/${testSessionId}',
  URL_SEND_LOGS: '/api/reporting/v1/test-runs/${testRunId}/logs',
  URL_SEND_SCREENSHOT: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}/screenshots',
};
const getRefreshToken = (token) => ({
  refreshToken: token,
});

const getTestRunStart = (reporterConfig, testRunUuid = null) => {
  const testRunStartBody = {
    uuid: testRunUuid || uuidv4(),
    name: '',
    startedAt: new Date(),
    status: 'IN_PROGRESS',
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

const getTestStart = (test) => ({
  name: test.fullTitle,
  startedAt: new Date(),
  className: test.testFileName,
  methodName: test.title,
});

const getTestEnd = (status) => ({
  endedAt: new Date(),
  result: status,
});

const getTestSessionStart = (session) => ({
  sessionId: session.sessionId,
  initiatedAt: new Date(),
  startedAt: new Date(),
  status: testSessionStatuses.RUNNING,
  desiredCapabilities: session.desiredCapabilities,
  capabilities: session.capabilities,
});

const getTestSessionUpdate = (testIds) => ({
  testIds,
});

const getTestSessionEnd = (testIds) => ({
  endedAt: new Date(),
  testIds,
});

module.exports = {
  API_URLS,
  getRefreshToken,
  getTestRunStart,
  getTestRunEnd,
  getTestStart,
  getTestEnd,
  getTestSessionStart,
  getTestSessionUpdate,
  getTestSessionEnd,
};
