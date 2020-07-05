const DependencyScaner = require('../scaner');

let rootResourcePath_s = '/home/nick/Documents/prj/sec4code2/static/packages/viewcompiler/test/index.js';

let depScaner = new DependencyScaner(rootResourcePath_s);
depScaner
  .directPropagation()
  .then(() => {
      const dependencyOrder = depScaner.backPropagation();
      console.log('dependencyOrder');
      console.dir(dependencyOrder);
  });
  
