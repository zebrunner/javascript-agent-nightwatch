const { ZebrunnerReporter, ZebrunnerReporterAPI } = require('../lib/index');
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
    done();
  },

  afterEach: (browser, done) => {
    ZebrunnerReporterAPI.finishTestSession(browser);
    done();
  },

};
