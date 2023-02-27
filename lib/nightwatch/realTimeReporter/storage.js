class Storage {
  #runId;

  #testsMap;

  #testSuitesMap;

  #testCasesFinishPromises;

  #testSessionsMap;

  #logsMap;

  #screenshotsMap;

  constructor() {
    this.#runId = null;
    this.#testsMap = new Map();
    this.#testSuitesMap = new Map();
    this.#testSessionsMap = new Map();
    this.#logsMap = new Map();
    this.#screenshotsMap = new Map();
    this.#testCasesFinishPromises = [];
  }

  get runId() {
    return this.#runId;
  }

  set runId(value) {
    this.#runId = value;
  }

  setTestStartPromise(uniqueId, startPromise) {
    this.#testsMap.set(uniqueId, {
      startPromise,
      zbrId: null,
      zbrSessionId: null,
      finishPromise: null,
    });
  }

  setTestZbrId(uniqueId, zbrId) {
    this.#testsMap.get(uniqueId).zbrId = zbrId;
  }

  setTestStartedAt(uniqueId, startedAt) {
    this.#testsMap.get(uniqueId).startedAt = startedAt;
  }

  setTestZbrSessionId(uniqueId, zbrSessionId) {
    this.#testsMap.get(uniqueId).zbrSessionId = zbrSessionId;
  }

  setTestFinishPromise(uniqueId, finishPromise) {
    this.#testsMap.get(uniqueId).finishPromise = finishPromise;
  }

  getTestByUniqueId(uniqueId) {
    return this.#testsMap.get(uniqueId);
  }

  getAllTestsStartPromises() {
    return Array.from(this.#testsMap.values()).map((i) => i.startPromise);
  }

  getAllTestsFinishPromises() {
    return Array.from(this.#testsMap.values()).map((i) => i.finishPromise);
  }

  setTestSuite(moduleUniqueId) {
    this.#testSuitesMap.set(moduleUniqueId, {
      sessionStartPromise: null,
      currentSession: null,
      trackAsOneZbrTest: null,
    });
  }

  setTestSuiteSessionStartPromise(moduleUniqueId, sessionStartPromise) {
    this.#testSuitesMap.get(moduleUniqueId).sessionStartPromise = sessionStartPromise;
  }

  setTestSuiteTrackAsOneZbrTest(moduleUniqueId, trackAsOneZbrTest) {
    this.#testSuitesMap.get(moduleUniqueId).trackAsOneZbrTest = trackAsOneZbrTest;
  }

  getTestSuiteByUniqueId(moduleUniqueId) {
    return this.#testSuitesMap.get(moduleUniqueId);
  }

  get testCasesFinishPromises() {
    return this.#testCasesFinishPromises;
  }

  addTestCaseFinishPromise(finishPromise) {
    this.#testCasesFinishPromises.push(finishPromise);
  }

  setTestSession(uniqueId, sessionUpdatePromise) {
    this.#testSessionsMap.set(uniqueId, {
      sessionUpdatePromise,
      finishPromise: null,
    });
  }

  setTestSessionFinishPromise(uniqueId, finishPromise) {
    if (this.#testSessionsMap.has(uniqueId)) {
      this.#testSessionsMap.get(uniqueId).finishPromise = finishPromise;

      return;
    }

    this.#testSessionsMap.set(uniqueId, {
      finishPromise,
    });
  }

  getAllTestSessionsUpdatePromises() {
    return Array.from(this.#testSessionsMap.values()).map(
      (i) => i.sessionUpdatePromise,
    );
  }

  getAllTestSessionsFinishPromises() {
    return Array.from(this.#testSessionsMap.values()).map(
      (i) => i.finishPromise,
    );
  }

  setLogs(uniqueId, sendLogsPromise) {
    this.#logsMap.set(uniqueId, {
      sendLogsPromise,
    });
  }

  getAllSendLogsPromises() {
    return Array.from(this.#logsMap.values()).map((i) => i.sendLogsPromise);
  }

  setScreenshot(uniqueId, readScreenshotPromise) {
    this.#screenshotsMap.set(uniqueId, {
      readScreenshotPromise,
      sendScreenshotPromise: null,
    });
  }

  setScreenshotSendPromise(uniqueId, sendScreenshotPromise) {
    this.#screenshotsMap.get(uniqueId).sendScreenshotPromise = sendScreenshotPromise;
  }

  getAllScreenshotsReadPromises() {
    return Array.from(this.#screenshotsMap.values()).map((i) => i.readScreenshotPromise);
  }

  getAllScreenshotsSendPromises() {
    return Array.from(this.#screenshotsMap.values()).map((i) => i.sendScreenshotPromise);
  }
}

module.exports = Storage;
