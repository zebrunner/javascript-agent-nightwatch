const path = require('path');
const { publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const {
  isCurrentTestPresent,
  isBlankString,
  isBuffer,
  isNotEmptyArray,
  getBase64Encode,
  getMimeTypeFromPath,
  isFunction,
} = require('../../utils');
const { parseNightwatchTestInfo } = require('../../object-transformer');

const CurrentTest = {
  setMaintainer: (browser, maintainer) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    if (isBlankString(maintainer)) {
      console.log(`Maintainer must be a not blank string. Provided value is '${maintainer}'`);

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    publishIPCEvent(REPORTING_EVENTS.SET_TEST_MAINTAINER, { test, maintainer });
  },

  attachLabel: (browser, key, ...values) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    if (isBlankString(key)) {
      console.log(`Label key must be a not blank string. Provided value is '${key}'`);

      return;
    }

    if (!isNotEmptyArray(values)) {
      console.log('You must provide at least one label value');

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    const labels = values.filter((value) => !isBlankString(value)).map((value) => ({ key, value }));

    if (isNotEmptyArray(labels)) {
      publishIPCEvent(REPORTING_EVENTS.ATTACH_TEST_LABELS, { test, labels });
    }
  },

  attachArtifactReference: (browser, name, value) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    if (isBlankString(name)) {
      console.log(
        `Artifact reference name must be a not blank string. Provided value is '${name}'`,
      );

      return;
    }

    if (isBlankString(value)) {
      console.log(
        `Artifact reference value must be a not blank string. Provided value for name '${name}' is '${value}'`,
      );

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    const references = [{ name, value }];
    publishIPCEvent(REPORTING_EVENTS.ATTACH_TEST_ARTIFACT_REFERENCES, { test, references });
  },

  uploadArtifactBuffer: (browser, name, type, buffer) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    if (isBlankString(name)) {
      console.log(`Artifact name must be a not blank string. Provided value is '${name}'`);

      return;
    }

    if (isBlankString(type)) {
      console.log(`Artifact type value must be a not blank string. Provided value is '${type}'`);

      return;
    }

    if (!isBuffer(buffer)) {
      console.log('Artifact buffer is incorrect');

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    const file = {
      name,
      type,
      content: buffer,
    };
    publishIPCEvent(REPORTING_EVENTS.UPLOAD_TEST_ARTIFACT, { test, file });
  },

  uploadArtifactFromFile: (browser, name, filePath) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    if (isBlankString(name)) {
      console.log(`Artifact name must be a not blank string. Provided value is '${name}'`);

      return;
    }
    const buffer = getBase64Encode(filePath);
    const mimeType = getMimeTypeFromPath(filePath);

    if (isBlankString(buffer) || isBlankString(mimeType)) {
      console.log(`Artifact file path '${filePath}' is incorrect or file not found`);

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    const file = {
      name,
      type: mimeType,
      content: buffer,
    };
    publishIPCEvent(REPORTING_EVENTS.UPLOAD_TEST_ARTIFACT, { test, file });
  },

  revertRegistration: (browser) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    publishIPCEvent(REPORTING_EVENTS.REVERT_TEST_REGISTRATION, { test });
  },

  saveScreenshot(browser) {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    let { screenshotsPath } = browser;

    if (isBlankString(screenshotsPath)) {
      const workingDir = process.cwd();
      screenshotsPath = `${workingDir}${path.sep}screens`;
    }
    const timestamp = Date.now();
    const filePath = `${screenshotsPath}${path.sep}screenshot_${timestamp}.png`;

    if (isFunction(browser.saveScreenshot)) {
      browser.saveScreenshot(filePath);

      const test = parseNightwatchTestInfo(browser);
      publishIPCEvent(REPORTING_EVENTS.SAVE_TEST_SCREENSHOT, { test, filePath, timestamp });
    }
  },
};

module.exports = CurrentTest;
