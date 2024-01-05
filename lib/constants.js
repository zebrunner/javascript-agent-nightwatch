const workerEvents = {
  WORKER_INIT: 'workerInit',
  PARENT_PROCESS_END: 'parentProcessEnd',
};

const testStatuses = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
};

const testSessionStatuses = {
  RUNNING: 'RUNNING',
  FAILED: 'FAILED',
};

const logLevels = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
};

const testRunners = {
  NIGHTWATCH: 'nightwatchRunner',
  MOCHA: 'mochaRunner',
};

const tcmTypes = {
  ZEBRUNNER: 'ZEBRUNNER',
  TEST_RAIL: 'TEST_RAIL',
  XRAY: 'XRAY',
  ZEPHYR: 'ZEPHYR',
};

const summarySendingPolicies = {
  ALWAYS: 'ALWAYS',
  NEVER: 'NEVER',
  IF_CONTAINS_NON_PASSED: 'IF_CONTAINS_NON_PASSED',
  IF_CONTAINS_UNKNOWN_ISSUES: 'IF_CONTAINS_UNKNOWN_ISSUES'
};

const LOCALE = 'com.zebrunner.app/sut.locale';

module.exports = {
  workerEvents,
  testStatuses,
  testSessionStatuses,
  logLevels,
  testRunners,
  tcmTypes,
  summarySendingPolicies,
  LOCALE,
};
