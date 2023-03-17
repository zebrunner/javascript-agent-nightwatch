const REPORTING_EVENTS = {
  START_TEST_SESSION: 'zbr:startTestSession',
  FINISH_TEST_SESSION: 'zbr:finishTestSession',

  START_TEST: 'zbr:startTest',
  FINISH_TEST: 'zbr:finishTest',

  ATTACH_TEST_RUN_LABELS: 'zbr:test-run:attachLabels',
  ATTACH_TEST_LABELS: 'zbr:test:attachLabels',

  ATTACH_TEST_RUN_ARTIFACT_REFERENCES: 'zbr:test-run:attachReferences',
  ATTACH_TEST_ARTIFACT_REFERENCES: 'zbr:test:attachReferences',

  UPLOAD_TEST_RUN_ARTIFACT: 'zbr:test-run:uploadArtifact',
  UPLOAD_TEST_ARTIFACT: 'zbr:test:uploadArtifact',

  SET_TEST_MAINTAINER: 'zbr:test:setMaintainer',
  REVERT_TEST_REGISTRATION: 'zbr:test:revertRegistration',
  SAVE_TEST_SCREENSHOT: 'zbr:test:saveScreenshot',

  ADD_TEST_CASES: 'zbr:test:addTestCase',
};

module.exports = {
  REPORTING_EVENTS,
};
