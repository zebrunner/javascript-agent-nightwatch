const Mocha = require('mocha');
const ConfigResolver = require('./config-resolver');
const ZebrunnerApiClient = require('./api-client');
const { workerEvents } = require('./constants');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_PENDING,
  EVENT_TEST_PASS,
  EVENT_TEST_FAIL,
} = Mocha.Runner.constants;

let zebrunnerApiClient;
let runStartPromise = process.env.ZEBRUNNER_RUN_ID ? new Promise((resolve) => resolve()) : null;
process.on('message', async (message) => {
  const { event } = message;
  switch (event) {
    case workerEvents.WORKER_INIT: {
      console.log('ZEBRUNNER WORKER INIT');
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
      console.log('EVENT_TEST_BEGIN');
      console.log(new Date(Date.now()).toString());

      runStartPromise.then(() => zebrunnerApiClient.startTest(message.test));

      break;
    }
    case EVENT_TEST_PENDING: {
      // console.log('EVENT_TEST_PENDING');
      // console.log(new Date(Date.now()).toString());
      // console.log('message', message);
      break;
    }
    case EVENT_TEST_PASS: {
      // console.log('EVENT_TEST_PASS');
      // console.log(new Date(Date.now()).toString());
      // console.log('message', message);
      break;
    }
    case EVENT_TEST_FAIL: {
      // console.log('EVENT_TEST_FAIL');
      // console.log(new Date(Date.now()).toString());
      // console.log('message', message);
      break;
    }
    case EVENT_RUN_END: {
      console.log('ZEBRUNNER REPORTER FINISHED');
      console.log(new Date(Date.now()).toString());

      runStartPromise.then(() => zebrunnerApiClient.registerTestRunFinish());

      break;
    }
    default:
      break;
  }
});