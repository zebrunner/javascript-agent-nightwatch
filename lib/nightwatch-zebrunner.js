const Mocha = require('mocha');
const ConfigResolver = require('./config-resolver');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_END,
  EVENT_TEST_PENDING,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
} = Mocha.Runner.constants;

const { startZbrIPC } = require('./ipc/server');
const { EVENTS } = require('./ipc/events');

let nightwatchConfig;

class ZbrReporter extends Mocha.reporters.Base {

  constructor(runner, config) {
    super(runner, config);
    console.log("Configuration: ");
    console.log(config.reporterOptions.zebrunnerConfig);
    this.configResolver = new ConfigResolver(config);
    this.configResolver.isConfigurationValid();

    const processConfigEvent = (config) => {
      console.log('PROCESS CONGIF', config)
      nightwatchConfig = config;
    };

    startZbrIPC(
      (server) => {
        console.log('--SERVER EVENTS SUBSCRIBE--')
        server.on(EVENTS.CONFIG, processConfigEvent);
      },
      (server) => {
        console.log('--SERVER EVENTS UNSUBSCRIBE--')
        server.off(EVENTS.CONFIG, '*');
      },
    );

    runner
      .once(EVENT_RUN_BEGIN, () => {
        console.log('---EVENT_RUN_BEGIN---');
      })
      .on(EVENT_SUITE_BEGIN, (test) => {
        console.log('---EVENT_SUITE_BEGIN---');
        // console.log(test);
      })
      .on(EVENT_SUITE_END, () => {
        console.log('---EVENT_SUITE_END---');
      })
      .on(EVENT_HOOK_BEGIN, () => {
        console.log('---EVENT_HOOK_BEGIN---');
      })
      .on(EVENT_HOOK_END, () => {
        console.log('---EVENT_HOOK_END---');
      })
      .on(EVENT_TEST_BEGIN, () => {
        console.log('---EVENT_TEST_BEGIN---');
      })
      .on(EVENT_TEST_PASS, (test) => {
        console.log(`---PASS: ${test.fullTitle()}---`);
      })
      .on(EVENT_TEST_FAIL, (test, err) => {
        console.log(`---FAIL: ${test.fullTitle()} - ERROR: ${err.message}---`);
      })
      .on(EVENT_TEST_END, (test) => {
        console.log(`---END: ${test.fullTitle()}---`);
      })
      .on(EVENT_TEST_PENDING, (test) => {
        console.log(`---PENDING: ${test.fullTitle()}---`);
      })
      .once(EVENT_RUN_END, () => {
        console.log(`---EVENT_RUN_END---`);
      });
  }
}

module.exports = ZbrReporter;
