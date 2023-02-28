const { publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const { isBlankString, isNotEmptyArray } = require('../../utils');

const CurrentTestRun = {

  attachLabel: (key, ...values) => {
    if (isBlankString(key)) {
      console.log(`Label key must be a not blank string. Provided value is '${key}'`);

      return;
    }

    if (!isNotEmptyArray(values)) {
      console.log('You must provide at least one label value');

      return;
    }

    const labels = values.filter((value) => !isBlankString(value)).map((value) => ({ key, value }));

    if (isNotEmptyArray(labels)) {
      publishIPCEvent(REPORTING_EVENTS.ATTACH_TEST_RUN_LABELS, labels);
    }
  },

  attachArtifactReference: (name, value) => {
    if (isBlankString(name)) {
      console.log(`Artifact reference name must be a not blank string. Provided value is '${name}'`);

      return;
    }

    if (isBlankString(value)) {
      console.log(`Artifact reference value must be a not blank string. Provided value for name '${name}' is '${value}'`);

      return;
    }

    const references = [{ name, value }];
    publishIPCEvent(REPORTING_EVENTS.ATTACH_TEST_RUN_ARTIFACT_REFERENCES, references);
  },
};

module.exports = CurrentTestRun;
