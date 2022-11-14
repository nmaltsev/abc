const Model = require('../model');
const model = new Model({prop: 'test'});
console.log('MODEL');
console.log(model.get('prop'));
