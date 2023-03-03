const { v4: uuidv4 } = require('uuid');
const { testSessionStatuses } = require('./constants');
const ConfigResolver = require('./config-resolver');

const API_URLS = {
  URL_REFRESH: '/api/iam/v1/auth/refresh',

  URL_EXCHANGE_RUN_CONTEXT: '/api/reporting/v1/run-context-exchanges',
  URL_START_RUN: '/api/reporting/v1/test-runs?projectKey=${project}',
  URL_FINISH_RUN: '/api/reporting/v1/test-runs/',

  URL_START_TEST: '/api/reporting/v1/test-runs/${testRunId}/tests',
  URL_UPDATE_TEST: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}',
  URL_FINISH_TEST: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}',
  URL_REVERT_TEST_REGISTRATION: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}',

  URL_START_SESSION: '/api/reporting/v1/test-runs/${testRunId}/test-sessions',
  URL_UPDATE_SESSION: '/api/reporting/v1/test-runs/${testRunId}/test-sessions/${testSessionId}',
  URL_FINISH_SESSION: '/api/reporting/v1/test-runs/${testRunId}/test-sessions/${testSessionId}',

  URL_SEND_LOGS: '/api/reporting/v1/test-runs/${testRunId}/logs',
  URL_SEND_SCREENSHOT: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}/screenshots',

  URL_ATTACH_TEST_RUN_LABELS: '/api/reporting/v1/test-runs/${testRunId}/labels',
  URL_ATTACH_TEST_LABELS: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}/labels',

  URL_ATTACH_TEST_RUN_ARTIFACT_REFERENCES: '/api/reporting/v1/test-runs/${testRunId}/artifact-references',
  URL_ATTACH_TEST_ARTIFACT_REFERENCES: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}/artifact-references',

  URL_UPLOAD_TEST_RUN_ARTIFACT: '/api/reporting/v1/test-runs/${testRunId}/artifacts',
  URL_UPLOAD_TEST_ARTIFACT: '/api/reporting/v1/test-runs/${testRunId}/tests/${testId}/artifacts',
};

const getRefreshToken = (token) => ({
  refreshToken: token,
});

const getTestRunStart = (reporterConfig, testRunUuid = null) => {
  const configResolver = new ConfigResolver(reporterConfig);

  const testRunStartBody = {
    uuid: testRunUuid || uuidv4(),
    name: configResolver.getReportingRunDisplayName(),
    startedAt: new Date(),
    status: 'IN_PROGRESS',
    framework: 'nightwatch',
    config: {
      treatSkipsAsFailures: configResolver.getReportingTreatSkipsAsFailures(),
    },
    milestone: {},
    notifications: {
      notifyOnEachFailure: configResolver.getReportingNotificationOnEachFailure(),
      targets: [],
    },
  };

  if (configResolver.getReportingRunEnvironment()) {
    testRunStartBody.config.environment = configResolver.getReportingRunEnvironment();
  }

  if (configResolver.getReportingRunBuild()) {
    testRunStartBody.config.build = configResolver.getReportingRunBuild();
  }

  if (configResolver.getReportingMilestoneId()) {
    testRunStartBody.milestone.id = configResolver.getReportingMilestoneId();
  }

  if (configResolver.getReportingMilestoneName()) {
    testRunStartBody.milestone.name = configResolver.getReportingMilestoneName();
  }

  if (configResolver.getReportingNotificationSlackChannels()) {
    testRunStartBody.notifications.targets.push({ type: 'SLACK_CHANNELS', value: configResolver.getReportingNotificationSlackChannels() });
  }

  if (configResolver.getReportingNotificationMsTeamsChannels()) {
    testRunStartBody.notifications.targets.push({ type: 'MS_TEAMS_CHANNELS', value: configResolver.getReportingNotificationMsTeamsChannels() });
  }

  if (configResolver.getReportingNotificationEmails()) {
    testRunStartBody.notifications.targets.push({ type: 'EMAIL_RECIPIENTS', value: configResolver.getReportingNotificationEmails() });
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

const setMaintainer = (maintainer) => ({
  maintainer,
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

const getAttachLabels = (labels) => ({
  items: [...labels],
});

const getAttachArtifactReferences = (references) => ({
  items: [...references],
});

module.exports = {
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
};
