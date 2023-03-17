const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('..');
const config = require('./nightwatch.conf');

let zbrReporter;

module.exports = {

  before: async () => {
    zbrReporter = new ZebrunnerReporter(config);
    await zbrReporter.startLaunch();
  },

  after: async () => {
    await zbrReporter.finishLaunch();
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
