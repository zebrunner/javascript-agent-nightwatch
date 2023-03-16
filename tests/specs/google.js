const { ZebrunnerReporterAPI } = require('../..');

describe('Google search', () => {
  const URL = 'https://www.google.com/';

  beforeEach((browser) => {
    ZebrunnerReporterAPI.startTest(browser, 'Google search');
  });

  afterEach((browser) => {
    ZebrunnerReporterAPI.finishTest(browser);
  });

  function performGoogleSearch(browser, searchValue) {
    browser
      .navigateTo(URL)
      .takeScreenshot()
      .waitForElementVisible('input[name=q]')
      .sendKeys('input[name=q]', [searchValue, browser.Keys.ENTER])
      .waitForElementVisible('#rso')
      .takeScreenshot();
  }

  it('Google search should be passed', (browser) => {
    const searchValue = 'Zebrunner';
    performGoogleSearch(browser, searchValue);

    browser.assert.urlContains(`search?q=${searchValue}`);
    browser.assert.textContains(
      {
        selector: '//*[@id="search"]//a',
        locateStrategy: 'xpath',
      },
      searchValue,
    );
  });

  it('Google search should be failed', (browser) => {
    const searchValue = 'Nightwatch';
    performGoogleSearch(browser, searchValue);

    browser.verify.urlEquals(`search?q=${searchValue}`);
    browser.verify.textEquals(
      {
        selector: '//*[@id="search"]//a',
        locateStrategy: 'xpath',
      },
      searchValue,
    );
  });

  it('Google search should be skipped', () => {});
});
