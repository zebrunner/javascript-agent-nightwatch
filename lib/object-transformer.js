const { v4: uuidv4 } = require('uuid');

const parseTestInfo = (test) => ({
  title: test.title,
  body: test.body,
  testFileName: test.file,
  parentTitle: test.parent.title,
  uniqueId: `${test.file}-${test.title}-${uuidv4()}`,
});

module.exports = {
  parseTestInfo,
};
