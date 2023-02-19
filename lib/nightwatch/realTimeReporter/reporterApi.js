const { connectIPCClient, disconnectIPCClient, publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { parseNightwatchTestInfo } = require('../../object-transformer');

const ReporterAPI = {
  startSuite: (browser) => {
    connectIPCClient();

    console.log('START-SUITE-EXECUTION');
    publishIPCEvent(REPORTING_EVENTS.START_SUITE, parseNightwatchTestInfo(browser));
  },
  finishSuite: (browser) => {
    console.log('FINISH-SUITE-EXECUTION');
    publishIPCEvent(REPORTING_EVENTS.FINISH_SUITE, parseNightwatchTestInfo(browser));

    setTimeout(() => {
      console.log('Disconnected!');
      disconnectIPCClient();
    }, 500);
  },
  startTest: (browser) => {
    console.log('START-TEST-EXECUTION');

    publishIPCEvent(REPORTING_EVENTS.START_TEST, parseNightwatchTestInfo(browser));
  },
  finishTest: (browser) => {
    console.log('FINISH-TEST-EXECUTION');

    publishIPCEvent(REPORTING_EVENTS.FINISH_TEST, parseNightwatchTestInfo(browser));
  },
  disconnect: () => {
    disconnectIPCClient();
  },
};

module.exports = ReporterAPI;
