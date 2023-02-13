class Storage {
  #testExecutions = [];

  createTestExecution = (name) => {
    this.#testExecutions.push({ name, isSent: false });
  };

  #getTestExecutionByName = (name) => this.#testExecutions.find((el) => el.name === name);

  addIdToTestExecution = (id, name) => {
    this.#getTestExecutionByName(name).id = id;
  };

  getTestExecutionIdByName = (name) => this.#testExecutions.find((el) => el.name === name)?.id;

  updateTestExecutionSentStatus = (name, isSent) => {
    this.#testExecutions.find((el) => el.name === name).isSent = isSent;
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
