const Model = require('../../backside/model');
const compile = require('../viewcompiler');

// (function(env){
//  console.log('ENV');
//  console.dir(env);
// 	env.viewcompiler = compile;
// 	env.Backside = {Model};
// }(this));

// this||self - is a global scope
(function(exports){
  exports.viewcompiler = compile;
  exports.Backside = {Model};
  Object.defineProperty(exports, '__esModule', { value: true });
}(this || module.exports));

// let model = new Model({prop1: 11});
// model.set('prop2', 2);
// console.dir(model);
// console.dir(this);
