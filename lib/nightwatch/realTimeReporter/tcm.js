const { publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { tcmTypes } = require('../../constants');
const { isBlankString, isNotEmptyArray, isCurrentTestPresent } = require('../../utils');
const { parseNightwatchTestInfo } = require('../../object-transformer');

const emitAddTestCaseEvent = (browser, tcmType, testCaseKey, resultStatus) => {
  if (!isCurrentTestPresent(browser)) {
    console.log('`browser` object of the current test must be specified as the first argument');

    return;
  }

  if (isBlankString(testCaseKey)) {
    console.log(`Test Case key must be a not blank string. Provided value is '${testCaseKey}'`);

    return;
  }

  const test = parseNightwatchTestInfo(browser);
  const testCase = {
    tcmType,
    testCaseId: testCaseKey,
    resultStatus,
  };

  publishIPCEvent(REPORTING_EVENTS.ADD_TEST_CASES, { test, testCase });
};

const Zebrunner = {

  testCaseKey: (browser, ...testCaseKeys) => {
    if (isNotEmptyArray(testCaseKeys)) {
      testCaseKeys.forEach((testCaseKey) => emitAddTestCaseEvent(browser, tcmTypes.ZEBRUNNER, testCaseKey));
    }
  },

  testCaseStatus: (browser, testCaseKey, resultStatus) => {
    emitAddTestCaseEvent(browser, tcmTypes.ZEBRUNNER, testCaseKey, resultStatus);
  },
};

const emitTestRailAddTestCaseEvent = (browser, testCaseId, resultStatus) => {
  let caseId = testCaseId;

  if (!isBlankString(testCaseId) && testCaseId.startsWith('C')) {
    caseId = testCaseId.substring(1);
  }
  emitAddTestCaseEvent(browser, tcmTypes.TEST_RAIL, caseId, resultStatus);
};

const TestRail = {

  testCaseId: (browser, ...testCaseIds) => {
    if (isNotEmptyArray(testCaseIds)) {
      testCaseIds.forEach((testCaseId) => emitTestRailAddTestCaseEvent(browser, testCaseId));
    }
  },

  testCaseStatus: (browser, testCaseId, resultStatus) => {
    emitTestRailAddTestCaseEvent(browser, testCaseId, resultStatus);
  },
};

const Xray = {

  testCaseKey: (browser, ...testCaseKeys) => {
    if (isNotEmptyArray(testCaseKeys)) {
      testCaseKeys.forEach((testCaseKey) => emitAddTestCaseEvent(browser, tcmTypes.XRAY, testCaseKey));
    }
  },

  testCaseStatus: (browser, testCaseKey, resultStatus) => {
    emitAddTestCaseEvent(browser, tcmTypes.XRAY, testCaseKey, resultStatus);
  },
};

const Zephyr = {

  testCaseKey: (browser, ...testCaseKeys) => {
    if (isNotEmptyArray(testCaseKeys)) {
      testCaseKeys.forEach((testCaseKey) => emitAddTestCaseEvent(browser, tcmTypes.ZEPHYR, testCaseKey));
    }
  },

  testCaseStatus: (browser, testCaseKey, resultStatus) => {
    emitAddTestCaseEvent(browser, tcmTypes.ZEPHYR, testCaseKey, resultStatus);
  },
};

module.exports = {
  Zebrunner, TestRail, Xray, Zephyr,
};
