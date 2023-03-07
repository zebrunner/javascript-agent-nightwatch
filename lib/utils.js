const fs = require('fs');
const glob = require('glob');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const mime = require('mime-types');

/**
 * Generates boundary parameter for Multipart request.
 * Should be an arbitrary value that not exceeds 70 bytes in length and consists only of 7-bit US-ASCII characters.
 * */
const generateMultipartBoundary = () => Math.floor(10000000 + Math.random() * 90000000);

const getBase64Encode = (file) => {
  if (fs.existsSync(file)) {
    const buffer = fs.readFileSync(file);

    return Buffer.from(buffer).toString('base64');
  }
};

const getMimeTypeFromPath = (file) => {
  if (fs.existsSync(file)) {
    return mime.lookup(file);
  }
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

const isEmptyObject = (value) => (Object.keys(value).length === 0 || Object.values(value).filter((prop) => prop).length === 0);

const isNotEmptyArray = (value) => (Array.isArray(value) && value.length !== 0);

const isBuffer = (value) => Buffer.isBuffer(value);

const isCurrentTestPresent = (browser) => !!((browser && browser.currentTest));

module.exports = {
  generateMultipartBoundary,
  getBase64Encode,
  getMimeTypeFromPath,
  getFileNameFromPath,
  getFailedScreenshot,
  getScreenshotByName,
  isBlankString,
  isEmptyObject,
  isNotEmptyArray,
  isBuffer,
  isCurrentTestPresent,
};
