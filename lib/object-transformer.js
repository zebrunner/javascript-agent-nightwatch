const path = require('path');
const { testStatuses } = require('./constants');

const getScreenshotFileBaseName = (testPath) => path.parse(testPath).name;

const getNightwatchTestExecutionResult = (testCaseResults) => {
  if (testCaseResults.skipped !== 0) {
    return {
      result: testStatuses.SKIPPED,
      reason: null,
    };
  }

  if (testCaseResults.failed !== 0) {
    const failedAssertion = testCaseResults.assertions.find((el) => el.failure !== false);

    return {
      result: testStatuses.FAILED,
      reason: `${failedAssertion.stackTrace}<br/>${failedAssertion.fullMsg}`,
    };
  }

  return {
    result: testStatuses.PASSED,
    reason: null,
  };
};

const parseTestInfo = (test, status, err) => ({
  title: test.title,
  fullTitle: test.fullTitle(),
  status: status || (test.state === 'pending' ? testStatuses.SKIPPED : test.state),
  err: (err && err.message) || err || (test.err && test.err.message),
  body: test.body,
  testFileName: test.file,
  parentTitle: test.parent.title,
  uniqueId: Buffer.from(
    `${test.parent?.parent?.file}-${test.id}-${test.fullTitle()}`,
    'utf-8',
  ).toString('base64'),
  screenshotFileBaseName: getScreenshotFileBaseName(test.file),
});

const parseNightwatchTestInfo = (test, status) => {
  const { result, reason } = getNightwatchTestExecutionResult(test.results);

  return {
    title: test.name,
    fullTitle: test.name,
    status,
    reason,
    result,
    testFileName: test.module,
    uniqueId: Buffer.from(`${test.module}-${test.name}`, 'utf-8').toString('base64'),
  };
};

module.exports = {
  parseTestInfo,
  parseNightwatchTestInfo,
};
