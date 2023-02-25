class Storage {
  #runId;

  #testsMap;

  constructor() {
    this.#runId = null;
    this.#testsMap = new Map();
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
    this.#testsMap.set(uniqueId, {
      zbrId,
    });
  }

  setTestStartedAt(uniqueId, startedAt) {
    this.#testsMap.set(uniqueId, {
      startedAt,
    });
  }

  setTestZbrSessionId(uniqueId, zbrSessionId) {
    this.#testsMap.set(uniqueId, {
      zbrSessionId,
    });
  }

  setTestFinishPromise(uniqueId, finishPromise) {
    this.#testsMap.set(uniqueId, {
      finishPromise,
    });
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
}

module.exports = Storage;
