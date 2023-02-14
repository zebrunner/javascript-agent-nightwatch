class Storage {
  #testExecutions = [];

  createTestExecution = (test) => {
    this.#testExecutions.push({ test, isSent: false });
  };

  #getTestExecutionByName = (name) => this.#testExecutions.find((el) => el.test.fullTitle === name);

  addIdToTestExecution = (id, name) => {
    this.#getTestExecutionByName(name).id = id;
  };

  getTestExecutionIdByName = (name) => this.#getTestExecutionByName(name)?.id;

  updateTestExecutionSentStatus = (name, isSent) => {
    this.#getTestExecutionByName(name).isSent = isSent;
  };

  addDataToTestExecution = (name, data) => {
    this.#getTestExecutionByName(name).data = data;
  };

  getAllTestExecutions = () => this.#testExecutions;

  getAllUnsentTestExecutions = () => this.#testExecutions.filter((el) => el.isSent === false);

  resetAllTestExecutions = () => {
    this.#testExecutions = [];
  };
}

module.exports = Storage;
