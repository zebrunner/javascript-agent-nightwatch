const fs = require('fs');
const { ZebrunnerReporterAPI, CurrentTestRun, CurrentTest } = require('../..');

module.exports = {

  beforeEach(browser) {
    CurrentTestRun.attachLabel('run_before_label', 'first', 'one more', '', null);
    CurrentTestRun.attachArtifactReference('documentation', 'https://zebrunner.com/documentation/');
    CurrentTestRun.uploadArtifactFromFile('configuration', './images/launcher_config.png');

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
    CurrentTest.attachLabel(browser, 'test', 'ecosia', 'pass');
    CurrentTest.attachLabel(browser, 'owner', 'developer');
    CurrentTest.attachArtifactReference(browser, 'nightwatch', 'https://nightwatchjs.org/');
    CurrentTest.setMaintainer(browser, 'asukhodolova');
    CurrentTest.uploadArtifactFromFile(browser, 'index', './index.js');

    browser
      .url('https://www.ecosia.org')
      .waitForElementVisible('body')
      .assert.titleContains('Ecosia')
      .assert.visible('input[type=search]')
      .setValue('input[type=search]', 'nightwatch')
      .assert.visible('button[type=submit]');
  },

  'step two: click submit': (browser) => {
    CurrentTest.attachLabel(browser, 'test', 'ecosia_final');
    // CurrentTest.revertRegistration(browser);

    browser
      .click('button[type=submit]')
      .assert.textContains('.layout__content', 'Nightwatch.js');
  },
};
