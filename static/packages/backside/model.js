const Events = require('./events');

function Model(attr){
	Events.call(this);
	this.attr = attr || {}; // required hasOwnProperty() method
}

Model.prototype = Object.create(Events.prototype);
Model.prototype.constructor = Events;

Model.prototype.set = function(){
	if (arguments.length == 2) {
		this.attr[arguments[0]] = arguments[1];
	} else {
		let 	collection = arguments[0],
				key;

		for(key in collection){
			this.attr[key] = collection[key];
		}
	}
};
	
/**
 * @param {string} key
 * @param {Any} value
 * @param {boolean} isForce
 * @return {void}
 */
Model.prototype._fire = function(key, value, isForce){
	// The value would be updated if it is a new value
	if (!isForce ? this.attr[key] === value : false) return;
	this.previous[key] = this.attr[key];
	this.attr[key] = value;
	this.changed[key] = value;
	this.trigger('change:' + key, value, this);
};

/**
 * @param {string | {[string]: any}} arg1
 * @param {any} [arg2]
 * @param {any} [arg3]
 */	
Model.prototype.change = function(){
	if (arguments.length === 0) return;

	this.changed = {};
	this.previous = {}; // a snapshot for the `change` event

	if(typeof(arguments[0]) == 'string'){
		this._fire(arguments[0], arguments[1], !!arguments[2]);
	} else {
		let collection = arguments[0];
		let key;

		for(key in collection){
			this._fire(key, collection[key], arguments[1]);
		}
	}
	this.trigger('change', this);
};

/**
 * @return {any} ref; 
 */
Model.prototype.get = function(key, _default){
	if(!~key.indexOf('.')){
		return this.attr.hasOwnProperty(key) ? this.attr[key] : _default;
	}

	let 	keys = key.split('.'),
			i = -1, 
			len = keys.length, 
			ref = this.attr;

	while(i++, i < len){
		ref = ref[keys[i]];

		if(ref == undefined) break;
	}
	return ref;
};

Model.prototype._get = function(key, def){
	return this.attr.hasOwnProperty(key) ? this.attr[key] : def;
};

Model.prototype.has = function(key){
	return this.attr.hasOwnProperty(key);
}

Model.prototype.destroy = function(){
	this.trigger('destroy', this);
	for(var key in this.attr){
		delete this.attr[key];
	}
	Events.prototype.destroy.call(this);
};

/**
 * @param {Object} map - exported fields
 * @param {Object} dest
 */
Model.prototype.export = function(map, dest){
	var 	out = dest || {},
			key;

	if (Array.isArray(map)) {
		key = map.length;
		while (key-- > 0) {
			if (this.has(map[key])) {
				out[map[key]] = this.get(map[key]);		
			}
		}
	} else {
		for (key in map) {
			if (this.has(map[key])) {
				out[key] = this.get(map[key]);
			}
		}
	}

	return out;
};

/**
 * @param {{[string]:function}} handlers_o
 * @param {boolean} [withDestructor]
 * @return {() => void | null}
 */
Model.prototype.listen = function(handlers_o, withDestructor=false){
	const handlers = {};
	for (let key_s in handlers_o) {
		handlers[key_s] = this.on(key_s, handlers_o[key_s]);
	}
	
	return withDestructor ? () => {
		for (let key_s in handlers) {
			this.off(key_s, handlers[key_s]);
		}
	} : null;
};

module.exports = Model;
