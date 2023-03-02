const fs = require('fs');
const glob = require('glob');
const path = require('path');

const getBase64Encode = (file) => {
  const buffer = fs.readFileSync(file);

  return Buffer.from(buffer).toString('base64');
};

const getFileNameFromPath = (filePath) => path.parse(filePath).name;

const getNewestFilesFirst = (pattern) => glob
  .sync(pattern)
  .map((name) => ({ name, ctime: fs.statSync(name).ctime }))
  .sort((a, b) => b.ctime - a.ctime);

const getFailedScreenshot = (testFileName) => {
  const pattern = `**/${testFileName}_FAILED_*.png`;
  const files = getNewestFilesFirst(pattern);

  return files.length ? files[0].name : undefined;
};

const getScreenshotByName = (screenshotFileName) => {
  const files = glob.sync(screenshotFileName.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), {
    matchBase: true,
  });

  return files.length ? files[0] : undefined;
};

const isBlankString = (value) => (!value || value.trim().length === 0);

const isNotEmptyArray = (value) => (Array.isArray(value) && value.length !== 0);

const isBuffer = (value) => Buffer.isBuffer(value);

const isCurrentTestPresent = (browser) => !!((browser && browser.currentTest));

module.exports = {
  getBase64Encode,
  getFileNameFromPath,
  getFailedScreenshot,
  getScreenshotByName,
  isBlankString,
  isNotEmptyArray,
  isBuffer,
  isCurrentTestPresent,
};
