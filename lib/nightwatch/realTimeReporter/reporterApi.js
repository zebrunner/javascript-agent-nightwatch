const { connectIPCClient, disconnectIPCClient, publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { parseNightwatchTestInfo, parseNightwatchBrowserConfig } = require('../../object-transformer');

const ReporterAPI = {
  startSuite: (browser) => {
    connectIPCClient();

    console.log('START-SUITE-EXECUTION');
    publishIPCEvent(REPORTING_EVENTS.START_SUITE, parseNightwatchBrowserConfig(browser));
  },
  finishSuite: (browser) => {
    console.log('FINISH-SUITE-EXECUTION');
    publishIPCEvent(REPORTING_EVENTS.FINISH_SUITE, parseNightwatchTestInfo(browser.currentTest));
    // TODO: issue with sending event, temporary solution
    setTimeout(() => {
      console.log('Disconnected!');
      disconnectIPCClient();
    }, 5000);
    // disconnectIPCClient();
  },
  startTest: (test) => {
    console.log('START-TEST-EXECUTION');

    publishIPCEvent(REPORTING_EVENTS.START_TEST, parseNightwatchTestInfo(test));
  },
  finishTest: (test) => {
    console.log('FINISH-TEST-EXECUTION');

    publishIPCEvent(REPORTING_EVENTS.FINISH_TEST, parseNightwatchTestInfo(test));
  },
};

module.exports = ReporterAPI;
