const { connectIPCClient, disconnectIPCClient, publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { parseNightwatchTestInfo } = require('../../object-transformer');

const ReporterAPI = {
  init: () => {
    connectIPCClient();
  },
  destroy: () => {
    disconnectIPCClient();
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
