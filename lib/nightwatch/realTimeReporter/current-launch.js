const { publishIPCEvent } = require('./ipc/client');
const { REPORTING_EVENTS } = require('./constants');
const {
  isBlankString,
  isNotEmptyArray,
  isBuffer,
  getBase64Encode,
  getMimeTypeFromPath,
} = require('../../utils');

const CurrentLaunch = {
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

    const references = [{ name, value }];
    publishIPCEvent(REPORTING_EVENTS.ATTACH_TEST_RUN_ARTIFACT_REFERENCES, references);
  },

  uploadArtifactBuffer: (name, type, buffer) => {
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
    const file = {
      name,
      type,
      content: buffer,
    };
    publishIPCEvent(REPORTING_EVENTS.UPLOAD_TEST_RUN_ARTIFACT, file);
  },

  uploadArtifactFromFile: (name, filePath) => {
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

    const file = {
      name,
      type: mimeType,
      content: buffer,
    };
    publishIPCEvent(REPORTING_EVENTS.UPLOAD_TEST_RUN_ARTIFACT, file);
  },
};

module.exports = CurrentLaunch;
