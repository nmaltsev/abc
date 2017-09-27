// $mLib v11 28/11/15 (from v10 07/10/15, v9 04/01/2015)
// namespace `$m` for some helpers methods
;(function(_env){
_env.$m = {
	// @memberOf $m - Detect if argument is instance of Function
	// @param {Object} obj
	// @return {Bool} - true if obj is a function
	isFunction: function(obj){
		return this.instance(obj) === '[object Function]'; 
	},
	// @memberOf $m - get type of argument
	// @return {Object} obj
	// @return {String}
	instance: function(obj){
		return Object.prototype.toString.call(obj);
	},
	isNumber: function(obj){
		return this.instance(obj) === '[object Number]'; 
	},
	isString: function(obj){
		return this.instance(obj) === '[object String]';
	},
	isRegExp: function(obj){
		return this.instance(obj) === '[object RegExp]'; 
	},
	isBoolean: function(obj){
		return this.instance(obj) === '[object Boolean]'; 
	},
	isObject: function(o){
		return o === Object(o);
	},
	// @memberOf $m - check if Object Empty
	// @param {Object} o
	// @return {Bool}
	isEmpty: function(o){
		if(!this.isObject(o)){
			return false;
		}

		for(var i in o){
		  if(o.hasOwnProperty(i)) return false;
		}

		return true;
	},
	defined: function(o){
		return typeof o != "undefined";
	},
	// Attention! Not clone object recursive
	// @memberOf $m - implementation of undescore _.extend method by es5 methods
	// @param {Object} target
	// @param {Object} source
	extend: function (target, source) {
		Object.
			getOwnPropertyNames(source).
			forEach(function(propKey) {
				var desc = Object.getOwnPropertyDescriptor(source, propKey);
				Object.defineProperty(target, propKey, desc);
			});
		return target;
	},
	// @memberOf $m - deep clone of object
	// @param {Object} o - origin object
	// @param {Bool} notUseRecursion
	// @return {Object} c
	clone: function(o, notUseRecursion) {// Out of the memory in IE8
		if(!o || 'object' !== typeof o){
			return o;
		}
		
		var     c = 'function' === typeof o.pop ? [] : {},
				p, 
				v;
				
		for(p in o) {
			if(o.hasOwnProperty(p)) {
			//if (Object.prototype.hasOwnProperty.call(o,p)){ // for IE8
				v = o[p];
				c[p] = (v && 'object' === typeof(v) && !notUseRecursion) ? this.clone(v) : v;
			}
		} 
		return c;
	},
	// @memberOf $m
	each: function(collection, callback){
		if(typeof(collection.length) != 'undefined'){
			for(var i = 0, len = collection.length; i < len; i++){
				callback(collection[i], i);
			}
		}else{
			for(var p in collection){
				if(collection.hasOwnProperty(p)){
					callback(collection[p], p);
				}
			}
		}
	},
	debounce: function(func, wait, immediate){
		var 	_timeout;

		return function() {
			var 	context = this, 
					args = arguments,
					later = function() {
						_timeout = null;
						if(!immediate){
							func.apply(context, args);	
						} 
					},
					callNow = immediate && !_timeout;

			clearTimeout(_timeout);
			_timeout = setTimeout(later, wait);
			
			if(callNow){
				func.apply(context, args);	
			} 
		};
	}
};
}(this))
