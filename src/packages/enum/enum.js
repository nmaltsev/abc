function Enum(...list) {
	if (list.length == 1 && list[0].constructor.name == 'Object') {
		return EnumCollection(list[0]);
	} else {
		return EnumList(list);
	}
}

function EnumList(list) {
	let obj = Object.create(null);
	let i = list.length;
	
	while (i-- > 0) {
		Object.defineProperty(obj, list[i], {value: i + 1, writable: false});
	}
	return obj;
} 

function EnumCollection(collection) {
	let obj = Object.create(null);
	let key;
	for (key in collection) {
		Object.defineProperty(obj, key, {value: collection[key], writable: false});
	}
	return obj;
}

module.exports = Enum;
