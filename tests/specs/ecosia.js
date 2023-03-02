const { ZebrunnerReporterAPI, CurrentTestRun, CurrentTest } = require('../..');

module.exports = {

  beforeEach(browser) {
    CurrentTestRun.attachLabel('run_before_label', 'first', 'one more', '', null);
    CurrentTestRun.attachArtifactReference('documentation', 'https://zebrunner.com/documentation/');

    ZebrunnerReporterAPI.startTest(browser);

    CurrentTest.attachLabel(browser, 'beforeEach', '   ', null, 'ecosia_1');
    CurrentTest.attachLabel(browser, 'beforeEach', 'ecosia_2');
  },

  afterEach(browser) {
    CurrentTest.attachLabel(browser, 'afterEach', 'ecosia_after');

    ZebrunnerReporterAPI.finishTest(browser);
  },

  after(browser) {
    browser.end();

    CurrentTestRun.attachLabel('run_after_label', 'smoke');
  },

  'step one: navigate to ecosia.org': (browser) => {
    CurrentTest.attachLabel(browser, 'test', 'ecosia', 'pass');
    CurrentTest.attachLabel(browser, 'owner', 'developer');
    CurrentTest.attachArtifactReference(browser, 'github', 'https://github.com/zebrunner');
    CurrentTest.setMaintainer(browser, 'asukhodolova');

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
