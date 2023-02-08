const Mocha = require('mocha');
const { fork } = require('child_process');
const ConfigResolver = require('./config-resolver');
const { workerEvents, testStatuses } = require('./constants');
const { parseTestInfo } = require('./object-transformer');

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

class ZbrReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner, config);
    this.runner = runner;

    this.configResolver = new ConfigResolver(config);

    if (this.configResolver.isReportingEnabled()) {
      if (!ZbrReporter.worker) {
        // console.log('new worker process was created in detached mode');
        this.worker = fork(`${__dirname}/process-worker.js`, [], {
          detached: true,
        });
        this.worker.send({ event: workerEvents.WORKER_INIT, config });

        ZbrReporter.worker = this.worker;
      } else {
        this.worker = ZbrReporter.worker;
      }

      this.runner.on(EVENT_RUN_BEGIN, () => {
        // console.log('---EVENT_RUN_BEGIN---');
        this.worker.send({
          event: EVENT_RUN_BEGIN,
          config,
        });
      });

      this.runner.on(EVENT_SUITE_BEGIN, () => {
        // console.log('---EVENT_SUITE_BEGIN---');
      });

      this.runner.on(EVENT_SUITE_END, () => {
        // console.log('---EVENT_SUITE_END---');
      });

      this.runner.on(EVENT_HOOK_BEGIN, () => {
        // console.log('---EVENT_HOOK_BEGIN---');
      });

      this.runner.on(EVENT_HOOK_END, () => {
        // console.log('---EVENT_HOOK_END---');
      });

      this.runner.on(EVENT_TEST_BEGIN, (test) => {
        // console.log('---EVENT_TEST_BEGIN---');
        this.worker.send({
          event: EVENT_TEST_BEGIN,
          test: parseTestInfo(test),
        });
      });

      this.runner.on(EVENT_TEST_PASS, () => {
        // console.log(`---PASS: ${test.fullTitle()}---`);
      });

      this.runner.on(EVENT_TEST_FAIL, (test, err) => {
        // console.log(`---FAIL: ${test.fullTitle()} - ERROR: ${err.message}---`);
        this.worker.send({
          event: EVENT_TEST_FAIL,
          test: parseTestInfo(test, testStatuses.FAILED, err),
        });
      });

      this.runner.on(EVENT_TEST_END, (test) => {
        // console.log('---EVENT_TEST_END---');
        this.worker.send({
          event: EVENT_TEST_END,
          test: parseTestInfo(test),
        });
      });

      this.runner.on(EVENT_TEST_PENDING, (test) => {
        // console.log(`---PENDING: ${test.fullTitle()}---`);
        this.worker.send({
          event: EVENT_TEST_PENDING,
          test: parseTestInfo(test, testStatuses.SKIPPED),
        });
      });

      this.runner.on(EVENT_RUN_END, () => {
        // console.log('---EVENT_RUN_END---');
        this.worker.send({
          event: EVENT_RUN_END,
        });
      });
    } else {
      console.log('ZEBRUNNER REPORTING IS TURNED OFF');
    }
  }
}

const sendEndProcessEvent = () => {
  if (ZbrReporter.worker) {
    ZbrReporter.worker.send({
      event: workerEvents.PARENT_PROCESS_END,
    });
  }
};

process.on('exit', () => {
  // console.log('----- Nightwatch running is done -----');
  sendEndProcessEvent();
  process.exit(0);
});

process.on('SIGINT', () => {
  // console.log('----- Caught interrupt signal -----');
  sendEndProcessEvent();
  process.exit(1);
});

// workaround for ctrl+C handling on Win platform
if (process.platform === 'win32') {
  // eslint-disable-next-line global-require
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', () => {
    // console.log('----- Caught interrupt signal (Windows) -----');
    sendEndProcessEvent();
  });
}

module.exports = ZbrReporter;
