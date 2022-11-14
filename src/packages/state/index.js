const {Action, GENERAL_ACTION} = require('./src/action');
// const {
//     cloneObject,
// 	cloneArray,
// 	isPrimitive,
//     isObjectContainer
// } = require('./src/deepClone');
// TODO uncomment the above code if it is interesting
const Events = require('./src/event');
const Storage = require('./src/storage');

module.exports = {
    Action, GENERAL_ACTION, Events, Storage
};
