const { publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { isCurrentTestPresent, isBlankString, isNotEmptyArray } = require('../../utils');
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
      console.log(`Artifact reference name must be a not blank string. Provided value is '${name}'`);

      return;
    }

    if (isBlankString(value)) {
      console.log(`Artifact reference value must be a not blank string. Provided value for name '${name}' is '${value}'`);

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    const references = [{ name, value }];
    publishIPCEvent(REPORTING_EVENTS.ATTACH_TEST_ARTIFACT_REFERENCES, { test, references });
  },

  revertRegistration: (browser) => {
    if (!isCurrentTestPresent(browser)) {
      console.log('`browser` object of the current test must be specified as the first argument');

      return;
    }

    const test = parseNightwatchTestInfo(browser);
    publishIPCEvent(REPORTING_EVENTS.REVERT_TEST_REGISTRATION, { test });
  },

};

module.exports = CurrentTest;
