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

const parseNightwatchTestInfo = (browser, testName) => {
  const test = browser.currentTest;

  const { result, reason, assertions } = getNightwatchTestExecutionResult(test.results);

  return {
    title: test.name,
    fullTitle: testName ? `${testName} - ${test.name}` : `${getFileNameFromPath(test.module)} - ${test.name}`,
    status: result,
    reason,
    assertions,
    testFileName: test.module,
    steps: test.results.steps,
    testcases: test.results.testcases,
    uniqueId: Buffer.from(`${test.module}-${test.name}`, 'utf-8').toString('base64'),
    moduleUniqueId: Buffer.from(test.module, 'utf-8').toString('base64'),
    sessionId: browser.sessionId,
    capabilities: browser.capabilities,
    desiredCapabilities: browser.desiredCapabilities,
    testName,
    trackAsOneZbrTest: test.name === '',
  };
};

const parseNightwatchSkipTestInfo = (test, name) => ({
  title: name,
  fullTitle: test.testName ? `${test.testName} - ${name}` : `${getFileNameFromPath(test.testFileName)} - ${name}`,
  status: testStatuses.SKIPPED,
  uniqueId: Buffer.from(`${test.testFileName}-${name}`, 'utf-8').toString('base64'),
  moduleUniqueId: Buffer.from(test.testFileName, 'utf-8').toString('base64'),
  testFileName: test.testFileName,
  trackAsOneZbrTest: false,
});

const getNightwatchTestInfoAsOneTest = (test) => {
  const testInfo = { ...test };

  const title = test.testName || getFileNameFromPath(test.testFileName);
  testInfo.title = title;
  testInfo.fullTitle = title;
  testInfo.uniqueId = test.moduleUniqueId;
  testInfo.trackAsOneZbrTest = true;

  return testInfo;
};

const combineTestCaseResults = (test) => {
  const testInfo = { ...test };
  const testCaseResults = {
    assertions: [],
    failed: 0,
    errors: 0,
    skipped: 0,
  };

  Object.keys(test.testcases).forEach((key) => {
    const { result } = getNightwatchTestExecutionResult(test.testcases[key]);
    testCaseResults.assertions.push({ fullMsg: `${result}: ${key}`, failure: false });
    testCaseResults.assertions = testCaseResults.assertions.concat(test.testcases[key].assertions);
    testCaseResults.failed += test.testcases[key].failed;
    testCaseResults.errors += test.testcases[key].errors;
    testCaseResults.skipped += test.testcases[key].skipped;
  });

  if (test.steps.length !== 0) {
    test.steps.forEach((step) => {
      testCaseResults.assertions.push({ fullMsg: `${testStatuses.SKIPPED}: ${step}`, failure: false });
    });
  }
  const { result, reason, assertions } = getNightwatchTestExecutionResult(testCaseResults);
  testInfo.status = result;
  testInfo.reason = reason;
  testInfo.assertions = assertions;

  return testInfo;
};

module.exports = {
  parseTestInfo,
  parseNightwatchTestInfo,
  parseNightwatchSkipTestInfo,
  getNightwatchTestInfoAsOneTest,
  combineTestCaseResults,
};
