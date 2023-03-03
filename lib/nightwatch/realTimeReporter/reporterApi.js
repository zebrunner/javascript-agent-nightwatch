const { connectIPCClient, disconnectIPCClient, publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { parseNightwatchTestInfo } = require('../../object-transformer');

const ZebrunnerReporterAPI = {

  startTestSession: (browser) => {
    connectIPCClient();

    publishIPCEvent(REPORTING_EVENTS.START_TEST_SESSION, parseNightwatchTestInfo(browser));
  },
  finishTestSession: (browser) => {
    publishIPCEvent(REPORTING_EVENTS.FINISH_TEST_SESSION, parseNightwatchTestInfo(browser));

    // necessary to have a small delay between sending an event and disconnecting from IPC
    setTimeout(() => {
      disconnectIPCClient();
    }, 500);
  },
  startTest: (browser, testName) => {
    publishIPCEvent(REPORTING_EVENTS.START_TEST, parseNightwatchTestInfo(browser, testName));
  },
  finishTest: (browser, testName) => {
    publishIPCEvent(REPORTING_EVENTS.FINISH_TEST, parseNightwatchTestInfo(browser, testName));
  },
};

module.exports = ZebrunnerReporterAPI;
