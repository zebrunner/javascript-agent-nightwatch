const { ZebrunnerReporterAPI, CurrentTestRun, CurrentTest } = require('../..');

module.exports = {

  beforeEach(browser) {
    CurrentTestRun.attachLabel('launch_key', 'hello!!!', 'one more', '', null);
    CurrentTestRun.attachArtifactReference('documentation', 'https://zebrunner.com/documentation/');
    ZebrunnerReporterAPI.startTest(browser);
  },

  afterEach(browser) {
    ZebrunnerReporterAPI.finishTest(browser);
  },

  after(browser) {
    browser.end();
  },

  'step one: navigate to ecosia.org': (browser) => {
    CurrentTest.attachLabel(browser, 'test_key', 'test_value');
    CurrentTest.attachArtifactReference(browser, 'github', 'https://github.com/zebrunner');

    browser
      .url('https://www.ecosia.org')
      .waitForElementVisible('body')
      .assert.titleContains('Ecosia')
      .assert.visible('input[type=search]')
      .setValue('input[type=search]', 'nightwatch')
      .assert.visible('button[type=submit]');
  },

  'step two: click submit': (browser) => {
    browser
      .click('button[type=submit]')
      .assert.textContains('.layout__content', 'Nightwatch.js');
  },
};
