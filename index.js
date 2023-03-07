const ZebrunnerReporter = require('./lib/nightwatch/realTimeReporter/reporter');
const ZebrunnerReporterAPI = require('./lib/nightwatch/realTimeReporter/reporterApi');
const ZebrunnerConfigurator = require('./lib/launcher-configurator');
const CurrentTestRun = require('./lib/nightwatch/realTimeReporter/current-test-run');
const CurrentTest = require('./lib/nightwatch/realTimeReporter/current-test');
const {
  Zebrunner, TestRail, Xray, Zephyr,
} = require('./lib/nightwatch/realTimeReporter/tcm');

module.exports = {
  ZebrunnerReporter,
  ZebrunnerReporterAPI,
  ZebrunnerConfigurator,
  CurrentTestRun,
  CurrentTest,
  Zebrunner,
  TestRail,
  Xray,
  Zephyr,
};
