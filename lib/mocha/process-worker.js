const Mocha = require('mocha');
const ConfigResolver = require('../config-resolver');
const ZebrunnerApiClient = require('./api-client');
const { workerEvents, logLevels } = require('../constants');
const { getFailedScreenshot } = require('../utils');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_PENDING,
  EVENT_TEST_FAIL,
  EVENT_TEST_END,
} = Mocha.Runner.constants;

let zebrunnerApiClient;
let runStartPromise = process.env.ZEBRUNNER_RUN_ID ? new Promise((resolve) => resolve()) : null;
let runEndPromise;

// TODO: necessary to refactor reporter for Mocha runner, see README for more information
process.on('message', async (message) => {
  const { event } = message;
  switch (event) {
    case workerEvents.WORKER_INIT: {
      // console.log('ZEBRUNNER WORKER INIT');
      this.configResolver = new ConfigResolver(message.config);
      zebrunnerApiClient = new ZebrunnerApiClient(message.config, this.configResolver, this.logger);

      break;
    }
    case EVENT_RUN_BEGIN: {
      console.log('ZEBRUNNER REPORTER STARTED');
      console.log(new Date(Date.now()).toString());

      runStartPromise = zebrunnerApiClient.registerTestRunStart();

      break;
    }
    case EVENT_TEST_BEGIN: {
      // console.log('EVENT_TEST_BEGIN');
      // console.log(new Date(Date.now()).toString());

      runStartPromise.then(() => zebrunnerApiClient.startTest(message.test));

      break;
    }
    case EVENT_TEST_PENDING: {
      // console.log('EVENT_TEST_PENDING');
      // console.log(new Date(Date.now()).toString());
      // console.log('message', message);

      runStartPromise.then(() => zebrunnerApiClient.skipTest(message.test));

      break;
    }
    case EVENT_TEST_FAIL: {
      // console.log('EVENT_TEST_FAIL');
      // console.log(new Date(Date.now()).toString());

      runStartPromise.then(() => {
        zebrunnerApiClient.sendLogs(
          message.test,
          [`Failure message: ${message.test?.err}`],
          logLevels.ERROR,
        );

        const failedScreenshot = getFailedScreenshot(message.test.screenshotFileBaseName);

        if (failedScreenshot) {
          zebrunnerApiClient.sendScreenshot(message.test, failedScreenshot);
        }
      });

      break;
    }
    case EVENT_TEST_END: {
      // console.log('EVENT_TEST_END');
      // console.log(new Date(Date.now()).toString());

      runStartPromise.then(() => zebrunnerApiClient.finishTest(
        message.test,
        message.test.status.toUpperCase(),
        message.test?.err,
      ));

      break;
    }
    case EVENT_RUN_END: {
      runEndPromise = zebrunnerApiClient.registerTestRunFinish();

      break;
    }
    case workerEvents.PARENT_PROCESS_END: {
      console.log('ZEBRUNNER REPORTER FINISHED');
      runEndPromise.then(() => {
        process.exit(0);
      });

      break;
    }
    default:
      break;
  }
});
