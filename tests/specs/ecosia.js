const fs = require('fs');
const {
  ZebrunnerReporterAPI,
  CurrentLaunch,
  CurrentTest,
  TestRail,
  Xray,
  Zephyr,
  Zebrunner,
} = require('../..');

module.exports = {
  beforeEach(browser) {
    CurrentLaunch.attachLabel('run_before_label', 'first', 'one more', '', null);
    CurrentLaunch.attachArtifactReference('documentation', 'https://zebrunner.com/documentation/');
    CurrentLaunch.uploadArtifactFromFile('configuration', './images/launcher_config.png');

    ZebrunnerReporterAPI.startTest(browser);

    CurrentTest.attachLabel(browser, 'beforeEach', '   ', null, 'ecosia_1');
    CurrentTest.attachLabel(browser, 'beforeEach', 'ecosia_2');
    CurrentTest.attachArtifactReference(browser, 'github', 'https://github.com/zebrunner');

    const buffer = fs.readFileSync('./README.md');
    CurrentTest.uploadArtifactBuffer(browser, 'artifact_image_name', 'image/png', buffer);

    CurrentTest.uploadArtifactFromFile(browser, 'test_picture', './images/launcher_config.png');
  },

  afterEach(browser) {
    ZebrunnerReporterAPI.finishTest(browser);
  },

  after(browser) {
    browser.end();
  },

  'step one: navigate to ecosia.org': (browser) => {
    TestRail.testCaseId(browser, '3435', 'C3438');
    TestRail.testCaseStatus(browser, '3435', 'failed');
    Xray.testCaseKey(browser, 'QT-2');
    Zephyr.testCaseKey(browser, 'QT-T1');
    Zebrunner.testCaseKey(browser, 'ANNAS-1', 'ANNAS-4');

    CurrentTest.attachLabel(browser, 'test', 'ecosia', 'pass');
    CurrentTest.attachLabel(browser, 'owner', 'developer');
    CurrentTest.attachArtifactReference(browser, 'nightwatch', 'https://nightwatchjs.org/');
    CurrentTest.setMaintainer(browser, 'asukhodolova');
    CurrentTest.uploadArtifactFromFile(browser, 'index', './index.js');

    CurrentTest.saveScreenshot(browser);

    browser
      .url('https://www.ecosia.org')
      .waitForElementVisible('body')
      .takeScreenshot()
      .assert.titleContains('Ecosia')
      .takeScreenshot()
      .assert.visible('input[type=search]')
      .takeScreenshot()
      .setValue('input[type=search]', 'nightwatch')
      .assert.visible('button[type=submit]');
  },

  'step two: click submit': (browser) => {
    TestRail.testCaseId(browser, '3436', '3477');
    Xray.testCaseKey(browser, 'QT-10', 'QT-11');
    Zephyr.testCaseKey(browser, 'QT-T2');
    Zebrunner.testCaseKey(browser, 'ANNAS-2');

    CurrentTest.attachLabel(browser, 'test', 'ecosia_final');
    // CurrentTest.revertRegistration(browser);

    browser
      .click('button[type=submit]')
      .takeScreenshot()
      .assert.textContains('.layout__content', 'Nightwsssssatch.js');
  },

  'step three: skipped': (browser) => {
    TestRail.testCaseId(browser, '3478');
    Xray.testCaseKey(browser, 'QT-18');
    Zephyr.testCaseKey(browser, 'QT-T3');
    Zebrunner.testCaseKey(browser, 'ANNAS-3');
  },
};
