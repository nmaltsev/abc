function Events(){
	this._init();
};

Events.prototype._init = function(){
	this._handlers = Object.create(null);
}

/**
 * @memberOf Events - execute event callbacks
 * @param {Object} options - event options
 * @return {boolean} - an event propogation has been stopped
 */
Events.prototype.trigger = function(){
	var		args = Array.prototype.slice.call(arguments), 	
				handlers = this._handlers[args.shift()];

	if(!Array.isArray(handlers)) return false;
	let i = handlers.length;
	while(i-- > 0){
		if(handlers[i].apply(null, args)){
			return true;
		}	
	}

	return false;
};

/**
 * @memberOf {Events} - remove all event listeners
 * @return {void}
 */
Events.prototype.destroy = function(){
	for(var key in this._handlers){
		this.off(key);
	}
};

/**
 * @memberOf {Events} - attach callback on change
 * @param {string} name - property of model
 * @param {Function} cb - callback
 */
Events.prototype.on = function(name, cb){
	if (!Array.isArray(this._handlers[name])) {
		this._handlers[name] = [];
	}
	this._handlers[name].push(cb);
	return cb;
};

/**
 * @memberOf {Events} - deattach event
 * @param {string} name - property of model
 * @param {Function} cb - callback
 */
Events.prototype.off = function(name, cb){
	var handlers = this._handlers[name];

	if (!Array.isArray(handlers)) return;
		
	if (cb) {
		let pos = handlers.indexOf(cb);

		if (pos != -1) handlers.splice(pos, 1);
		if (handlers.length == 0) delete this._handlers[name];
	} else {
		handlers.length = 0;
		delete this._handlers[name];
	}
};

/**
 * @memberOf {Events} - delete all event listeners
 */
Events.prototype.destroy = function(){
	this._init();
};

/**
 * @memberOf {Events} - attach callback on change
 * @param {string} name - property of model
 * @param {Function} cb - callback
 * @return {Function} handler
 */
Events.prototype.once = function(name, cb){
	if(!Array.isArray(this._handlers[name])){
		this._handlers[name] = [];
	}
	var _cb = function(){
		this.off(name, _cb);
		return cb.apply(this, Array.prototype.slice.call(arguments));
	}.bind(this);
	this._handlers[name].push(_cb);
	return _cb;
};
	
module.exports = Events;
