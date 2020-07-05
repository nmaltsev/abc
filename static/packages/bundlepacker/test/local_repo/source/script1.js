const packageValue = require('package.a/file1');

const additionalResource = './attach';
const additionalValue = require(additionalResource);

module.exports = {
  value: 'property2',
  packageValue,
  additionalValue,
};
