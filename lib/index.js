const ZebrunnerReporter = require('./nightwatch/realTimeReporter/reporter');
const ZebrunnerReporterAPI = require('./nightwatch/realTimeReporter/reporterApi');
const ZebrunnerConfigurator = require('./launcher-configurator');
const CurrentTestRun = require('./nightwatch/realTimeReporter/current-test-run');
const CurrentTest = require('./nightwatch/realTimeReporter/current-test');
const {
  Zebrunner, TestRail, Xray, Zephyr,
} = require('./nightwatch/realTimeReporter/tcm');

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
