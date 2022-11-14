const stateLib = require('../index');
const {Events, Storage, Action} = stateLib;
console.log('stateLib');
console.log(typeof(module));
console.dir(Object.keys(stateLib));

const storage = new Storage();
console.dir(storage);
storage.on('change:property1', function(value, action, storage){
    console.log('[property1 changed] %s', value);
    console.dir(action);
});

storage.dispatch(new Action('CHANGE_PROPERTY', {
    property1: 123,
    property2: 'abc'
}));