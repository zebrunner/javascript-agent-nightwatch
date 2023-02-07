const { testStatuses } = require('./constants');

const parseTestInfo = (test, status, err) => ({
  title: test.title,
  fullTitle: test.fullTitle(),
  status: status || (test.state === 'pending' ? testStatuses.SKIPPED : test.state),
  err: (err && err.message) || err || (test.err && test.err.message),
  body: test.body,
  testFileName: test.file,
  parentTitle: test.parent.title,
  uniqueId: Buffer.from(`${test.parent?.parent?.file}-${test.id}-${test.fullTitle()}`, 'utf-8').toString('base64'),
  screenshotFileBaseName: getScreenshotFileBaseName(test.titlePath()),
});

const getScreenshotFileBaseName = (testItemPath) => `${testItemPath.join(' -- ')}`;

module.exports = {
  parseTestInfo,
};
