const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('..');
const config = require('./nightwatch.conf');

let zbrReporter;

module.exports = {

  before: async () => {
    zbrReporter = new ZebrunnerReporter(config);
    await zbrReporter.startTestRun();
  },

  after: async () => {
    await zbrReporter.finishTestRun();
  },

  beforeEach: (browser, done) => {
    ZebrunnerReporterAPI.startTestSession(browser);
    // ZebrunnerReporterAPI.startTest(browser);
    done();
  },

  afterEach: (browser, done) => {
    // ZebrunnerReporterAPI.finishTest(browser);
    ZebrunnerReporterAPI.finishTestSession(browser);
    done();
  },

};
