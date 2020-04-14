const Model = require('../../backside/model');
const compile = require('../viewcompiler');

(function(env){
  console.log('ENV');
  console.dir(env);
	env.viewcompiler = compile;
	env.Backside = {Model};
}(this));

(function(env){
  console.log('ENV');
  console.dir(env);
}(this));


let model = new Model({prop1: 11});
model.set('prop2', 2);
console.dir(model);
console.dir(this);
