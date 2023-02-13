const workerEvents = {
  WORKER_INIT: 'workerInit',
  PARENT_PROCESS_END: 'parentProcessEnd',
};

const testStatuses = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
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

module.exports = {
  workerEvents,
  testStatuses,
  logLevels,
  testRunners,
};
