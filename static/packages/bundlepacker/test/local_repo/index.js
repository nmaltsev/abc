const packageValue = require('package.a/file1');
const packageIndexValue = require('index'); // the file from the packages folder
const sourceValue = require('./source/script1'); // the file with relative path

console.dir([packageValue, packageIndexValue, sourceValue]);
