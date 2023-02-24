const { ZebrunnerReporterAPI } = require('../../lib/index');

module.exports = {

  beforeEach(browser) {
    ZebrunnerReporterAPI.startTest(browser);
  },

  afterEach(browser) {
    ZebrunnerReporterAPI.finishTest(browser);
  },

  after(browser) {
    browser.end();
  },

  'step one: navigate to ecosia.org': (browser) => {
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
