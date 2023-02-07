const fs = require('fs');
const glob = require('glob');

const getNewestFilesFirst = (pattern) => glob
  .sync(pattern)
  .map((name) => ({ name, ctime: fs.statSync(name).ctime }))
  .sort((a, b) => b.ctime - a.ctime);

const getFailedScreenshot = (testFileName) => {
  const pattern = `**/${testFileName}_FAILED_*.png`;
  const files = getNewestFilesFirst(pattern);

  return files.length ? files[0].name : undefined;
};

module.exports = {
  getFailedScreenshot,
};
