function cloneObject(originalObject) {
    const obj = Object.assign({}, originalObject);

    for (let key in obj) {
        if(!obj.hasOwnProperty(key)) continue;
        // skip null and primitive values
        if (isPrimitive(obj[key])) continue;
        if (isObjectContainer(obj[key])) {
            obj[key] = cloneObject(obj[key]);
        } else if (Array.isArray(obj[key])){
            obj[key] = cloneArray(obj[key]);
        }
        // TODO handle other types
    }
    return obj;
}
  
/* null or primitive value */
function isPrimitive(value) {
    return !(value instanceof Object && typeof(value) === 'object');
}

function isObjectContainer(value) {
    return value.__proto__ && value.__proto__.constructor === Object;
}

function cloneArray(originalArray) {
    const list = originalArray.slice(0);

    for (let i = 0; i < list.length; i++) {
        if (Array.isArray(list[i])) {
            list[i] = cloneArray(list[i]);
        } else if (isObjectContainer(list[i])) {
            list[i] = cloneObject(list[i]);
        }
    }
    return list;
}

module.exports = {
	cloneObject,
	cloneArray,
	isPrimitive,
	isObjectContainer
};
