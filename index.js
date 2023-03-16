const ZebrunnerReporter = require('./lib/nightwatch/realTimeReporter/reporter');
const ZebrunnerReporterAPI = require('./lib/nightwatch/realTimeReporter/reporterApi');
const ZebrunnerConfigurator = require('./lib/launcher-configurator');
const CurrentLaunch = require('./lib/nightwatch/realTimeReporter/current-launch');
const CurrentTest = require('./lib/nightwatch/realTimeReporter/current-test');
const {
  Zebrunner, TestRail, Xray, Zephyr,
} = require('./lib/nightwatch/realTimeReporter/tcm');

module.exports = {
  ZebrunnerReporter,
  ZebrunnerReporterAPI,
  ZebrunnerConfigurator,
  CurrentLaunch,
  CurrentTest,
  Zebrunner,
  TestRail,
  Xray,
  Zephyr,
};
