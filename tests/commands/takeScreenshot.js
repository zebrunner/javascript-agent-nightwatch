const { CurrentTest } = require('../..');

module.exports = {
  command() {
    return this.perform(() => {
      CurrentTest.saveScreenshot(this);
    });
  },
};
