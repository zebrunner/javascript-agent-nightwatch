const { getFileNameFromPath } = require('./utils');
const { testStatuses } = require('./constants');

const getNightwatchTestExecutionResult = (testCaseResults) => {
  if (testCaseResults.skipped !== 0) {
    return {
      result: testStatuses.SKIPPED,
      reason: null,
    };
  }
  const assertions = testCaseResults.assertions.map(({ fullMsg, failure, screenshots }) => ({ fullMsg, failure, screenshots }));

  if (testCaseResults.failed !== 0) {
    const failedAssertion = testCaseResults.assertions.find((el) => el.failure !== false);

    return {
      result: testStatuses.FAILED,
      reason: `${failedAssertion.name}: ${failedAssertion.fullMsg}\n ${failedAssertion.stackTrace}`,
      assertions,
    };
  }

  if (testCaseResults.errors !== 0) {
    assertions.push({ fullMsg: testCaseResults.stackTrace, failure: true });

    return {
      result: testStatuses.FAILED,
      reason: `${testCaseResults.stackTrace}`,
      assertions,
    };
  }

  return {
    result: testStatuses.PASSED,
    reason: null,
    assertions,
  };
};

const parseTestInfo = (test, status, err) => ({
  title: test.title,
  fullTitle: test.fullTitle(),
  status: status || (test.state === 'pending' ? testStatuses.SKIPPED : test.state),
  reason: (err && err.message) || err || (test.err && test.err.message),
  body: test.body,
  testFileName: test.file,
  parentTitle: test.parent.title,
  uniqueId: Buffer.from(
    `${test.parent?.parent?.file}-${test.id}-${test.fullTitle()}`,
    'utf-8',
  ).toString('base64'),
  screenshotFileBaseName: getFileNameFromPath(test.file),
});

const parseNightwatchTestInfo = (test, status) => {
  const { result, reason, assertions } = getNightwatchTestExecutionResult(test.results);

  return {
    title: test.name,
    fullTitle: `${getFileNameFromPath(test.module)} - ${test.name}`,
    status: status || result,
    reason,
    assertions,
    testFileName: test.module,
    uniqueId: Buffer.from(`${test.module}-${test.name}`, 'utf-8').toString('base64'),
  };
};

module.exports = {
  parseTestInfo,
  parseNightwatchTestInfo,
};
