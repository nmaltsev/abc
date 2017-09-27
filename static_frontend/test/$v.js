// $vLib v10 2015/05/06
// TODO use $v.Events as prototype of Model
var $v = {}; // Framework name space

// Implementation of Event Emitter
$v.Events = function(){
	this.onchange = {};
};

// @memberOf Events - execute event callbacks
// @param {Object} options - event options
// @return {Bool} - if true - stop event propagation
$v.Events.prototype.trigger = function(name, options){
	var 	handlers = this.onchange[name],
			i;

	if(Array.isArray(handlers)){
		// for(var i = 0, len = handlers.length; i < len; i++){
		// 	if(this.onchange[name][i](options)){
		// 		return true;
		// 	}
		// }
		i = handlers.length;
		while(i--){
			if(handlers[i](options)){
				return true;
			}	
		}
	}
	return false;
};
// @memberOf {Events} - remove all event listeners
$v.Events.prototype.destroy = function(){
	for(var key in this.onchange){
		this.onchange.hasOwnProperty(key) && this.off(key);
	}
};
// @memberOf {Events} - attach callback on change
// @param {String} name - property of model
// @param {Function} cb - callback
$v.Events.prototype.on = function(name, cb){
	if(!Array.isArray(this.onchange[name])){
		this.onchange[name] = [];
	}
	this.onchange[name].push(cb);
};
// @memberOf {Events} - deattach event
// @param {String} name - property of model
// @param {Function} cb - callback
$v.Events.prototype.off = function(name, cb){
	var handlers = this.onchange[name];
	
	if(Array.isArray(handlers)){
		if(cb){
			var pos = handlers.indexOf(cb);
			pos != -1 && handlers.splice(pos, 1);

			if(handlers.length == 0){
				delete this.onchange[name];
			}
		}else{
			handlers.length = 0;
			delete this.onchange[name];
		}
	}
};
// @memberOf {Events} - attach callback on change
// @param {String} name - property of model
// @param {Function} cb - callback
// @return {Function} handler
$v.Events.prototype.once = function(name, cb){
	if(!Array.isArray(this.onchange[name])){
		this.onchange[name] = [];
	}
	var _cb = function(args){
		this.off(name, _cb);
		return cb(args);
	}.bind(this);
	this.onchange[name].push(_cb);
	return _cb;
};


// Default Model Constructor
$v.Model = function(initObj){
	this.attr = initObj || {};
	this.onchange = {};
};

// @memberOf {BaseModel} - set value to model attribute without event triggering
// @param {String} name (can be like 'user.group.id')
// @param {*} value
$v.Model.prototype.set = function(name, value){
	var 	prev,
			split = '.';

	if(~name.indexOf(split)){
		var 	parts = name.split(split),
				root = this.attr,
				len = parts.length,
				seg;
				
		for(var i = 0; seg = parts[i], i < len - 1; i++){
			
			if(!root[seg]){
				root[seg] = {};
			}
			root = root[seg];
		}
		prev = root[seg];
		root[seg] = value;
	}else{
		prev = this.attr[name];
		this.attr[name] = value;
	}
};
// @memberOf {BaseModel} - set value to model attribute with event triggering
// @param {String} name (can be like 'user.group.id')
// @param {*} value
$v.Model.prototype.change = function(name, value){
	var 	root = this.attr,
			seg = name,
			prev = this.attr[name],
			eventStack = [],
			split = '.';

	if(~name.indexOf(split)){
		var 	parts = name.split(split),
				len = parts.length;
				
		name = '';		
		for(var i = 0; seg = parts[i], i < len - 1; i++){
			
			if(!root[seg]){
				root[seg] = {};
			}
			root = root[seg];
			name += (i ? '.' : '') + seg;
			//console.log('Prev key: `%s`', name);
			if(this.onchange[name]){
				eventStack.push(name);
			}
		}
		//console.log('Final seg %s', seg);
		prev = root[seg];
		root[seg] = value;
		//console.dir(this.attr);
		name += '.' + seg;
	}else{
		//prev = root[seg];
		root[seg] = value;
	}
	
	// console.log('Prev key: `%s`', name);
	if(this.onchange[name]){
		eventStack.push(name);
	}
	
	var 	evIndex = eventStack.length,
			callbackRes;
	
	if(evIndex){
		while(evIndex--){
			//console.log('Ev #%s %s', evIndex, eventStack[evIndex]);
			
			if(this._trigger(eventStack[evIndex], name, value, prev)){ // if callback return true - stop propagation
				break;
			}
		}
	}
};
// @memberOf {BaseModel} - execute event callbacks
// @param {String} name - event name
// @param {String} property - modify property
// @param {String} value - new value
// @param {String} prev - previous value
// @return {Bool} - if true - stop event propagation
$v.Model.prototype._trigger = function(name, property, value, prev, operation){
	if(Array.isArray(this.onchange[name])){
		for(var i = 0, len = this.onchange[name].length; i < len; i++){
			if(this.onchange[name][i](value, property, this, prev, operation)){
				return true;
			}
		}
	}
	return false;
};
// @memberOf {BaseModel}
// @param {String} name,
$v.Model.prototype.get = function(name){
	if(~name.indexOf('.')){
		var 	names = name.split("."),
				i = -1, 
				len = names.length, 
				ref = this.attr;
				
		while(i++, i < len){
			ref = ref[names[i]];
			if(ref == undefined){
				break;
			} 
		}
		return ref;
	}else{
		return this.attr[name];
	}
};
// Sometimes key may content dot symbol
// @memberOf {BaseModel}
// @param {String} - List of keys
$v.Model.prototype.gets = function(){
	var 	ref = this.attr, 
			i = 0;

	for(; i < arguments.length; i++){
		ref = ref[arguments[i]];
		if(ref == undefined){
			break;
		} 
	}
	return ref;
};
// @memberOf {BaseModel} - remove all event listeners
$v.Model.prototype.destroy = function(){
	for(var key in this.onchange){
		if(this.onchange.hasOwnProperty(key)){
			this.off(key);
		}
	}
};
// @memberOf {BaseModel} - attach callback on change
// @param {String} name - property of model
// @param {Function} cb - callback
$v.Model.prototype.on = function(name, cb){
	if(!Array.isArray(this.onchange[name])){
		this.onchange[name] = [];
	}
	this.onchange[name].push(cb);
};
// @memberOf {BaseModel} - deattach event
// @param {String} name - property of model
// @param {Function} cb - callback
$v.Model.prototype.off = function(name, cb){
	if(Array.isArray(this.onchange[name])){
		if(cb){
			var pos = this.onchange[name].indexOf(cb);
			this.onchange[name].splice(pos, 1);
		}else{
			this.onchange[name].length = 0;
		}
	}
};
// @return {Object} - represent model data
$v.Model.prototype.toJSON = function(){
	return $m.clone(this.attr);
};
$v.Model.prototype.list = function(name, operation, value){
	// TODO use code of change()
	var 	prev,
			seg = name,
			res,
			root = this.attr,
			eventStack = [];
	if(~name.indexOf('.')){
		var 	parts = name.split('.'),
				len = parts.length;
		name = '';		
		for(var i = 0; seg = parts[i], i < len - 1; i++){
			//console.log('\tSEG `%s`', seg);
			if(!root[seg]){
				root[seg] = {};
			}
			root = root[seg];
			name += (i ? '.' : '') + seg;
			//console.log('Prev key: `%s`', name);
			if(this.onchange[name]){
				eventStack.push(name);
			}
		}
		//console.log('Final seg %s', seg);
		name += '.' + seg;
	}
	prev = root[seg];
	
	if(Array.isArray(prev)){
		switch(operation){
			case 'push': res = prev.push(value); break; // ret new length
			case 'del': res = prev.splice(value, 1); break; // remove by index, return array with removed
			case 'pop':  res = prev.pop(); break; // remove last return last
			case 'shift': res = prev.shift(); break; //remove first, return first
			case 'removeAll': 
				// @param {Function} value - cb(item, index)
				// @return {Array} list of removed items 
				var 	index = prev.length,
						removed = [];

				while(index--){
					if(value(prev[index], index)){
						removed = removed.concat(prev.splice(index, 1));
					} 
				}
				value = res = removed;
				break;
			case 'reject': root[seg] = value; break;
			case 'indexOf':
				// @param {Function} value - cb(item, index)
				// @return {Int} position of item
				res = -1;
				for(var  index = 0, len = prev.length; index < len; index++){
					if(value(prev[index], index)){
						res = index;
						break;
					}
				}
				break;
		}
	}else{
		root[seg] = value; // Maybe create new array
	}
	// console.log('\t Final name: `%s`', name);
	if(this.onchange[name]){
		eventStack.push(name);
	}
	
	var 	evIndex = eventStack.length,
			callbackRes;

	if(evIndex){ // can work without this statement
		while(evIndex--){
			if(this._trigger(eventStack[evIndex], name, value, prev, operation)){ // if callback return true - stop propagation
				break;
			}
		}
	}
	return res;
}


$v.View = function(options){
	this.controls = {};
	this._handlers = {};
	this.initialize(options || {});
}
$v.View.prototype.initialize = function(options){
	if(options.el){
		this.el = options.el;
	}else{
		this.el = document.createElement(options.tagName || 'div');
		this.el.className = options.className || this.className;
	}
	this.model = options.model;
	this.render();
	this.bindByData(this.el);
};
// create el node if it necessery 
$v.View.prototype.render = function(){
	if(typeof(this.template) == 'string'){
		if(this.model){
			this.el.innerHTML = $helpers.supplant(this.template, this.model.attr);
		}else{
			this.el.innerHTML = this.template;
		}
	}
};
// @memberOf {View} - remove events and controls
$v.View.prototype.destroy = function(){
	this.off();
	this._emptyObject(this.controls);
};
$v.View.prototype.bindByData = function(root){
	var		pos,
			$nodes = (root || document).querySelectorAll('[data-co]');
			
	for(var i = $nodes.length - 1, field, $node; $node = $nodes[i], i >= 0; i--){
		field = ($node.dataset.co || 'root').replace(this.CATCH_DEFIS, this._replaceDefis);
		this.controls[field] = $node;
	}
};
$v.View.prototype.CATCH_DEFIS = /-(\w)/g;
$v.View.prototype._replaceDefis = function(str, p1, offset, s) {
	 return p1.toUpperCase();
};
$v.View.prototype._emptyObject = function(obj){
	for(var itemName in obj){
		if(obj.hasOwnProperty(itemName)){
			obj[itemName] = null;
		}
	}
};
// @param {Element} elem
// @param {String} event
// @param {Function} cb
$v.View.prototype.on = function(elem, event, cb){
	var 	element,
			eventName,
			callback;
			
	switch(arguments.length){
		case 3:
			element = arguments[0];
			
			if(typeof(element) == 'string'){
				element = this.controls[element];
			}
			eventName = arguments[1];
			callback = arguments[2];
			break;
		case 2:
			element = this.el;
			eventName = arguments[0];
			callback = arguments[1];
			break;
	}
	if(!element){
		console.warn('Can`t attach event handler to undefined node');
		return;
	}
	
	if(!Array.isArray(this._handlers[eventName])){
		this._handlers[eventName] = [];
	}
	this._handlers[eventName].push({
		node: element,
		callback: callback
	});
	element.addEventListener(eventName, callback, false);
};
$v.View.prototype.off = function(){
	switch(arguments.length){
		case 3:
			var 	element = arguments[0],
					eventName = arguments[1],
					callback = arguments[2],
					handlers = this._handlers[eventName],
					handlerCount;
			
			element.removeEventListener(eventName, callback, false);
					
			if(Array.isArray(handlers)){
				handlerCount = handlers.length;
				while(handlerCount--){
					if(handlers[handlerCount].node == element && handlers[handlerCount].callback == callback){
						handlers.splice(handlerCount, 1);
					}
				}
				handler.length = 0;
			}
			break;
		case 2: // all event handlers on element 
			this._removeAllHandlersOfElement(arguments[0], arguments[1]);
			break;
		case 1: //all handlers of element
			this._removeAllEventsOfElement(arguments[0]);
			break;
		case 0: // allEvents 
			var 	handlers,
					handlerCount;
					
			for(var eventName in this._handlers){
				if(this._handlers.hasOwnProperty(eventName)){
					handlers = this._handlers[eventName];
					
					if(Array.isArray(handlers)){
						handlerCount = handlers.length;
						while(handlerCount--){
							handlers[handlerCount].node.removeEventListener(eventName, handlers[handlerCount].callback);
							
						}
						handlers.length = 0;
					}
				}
			}
			break;
	}
};
$v.View.prototype._removeAllHandlersOfElement = function(element, eventName){
	var 	handlers = this._handlers[eventName],
			handlerCount;
			
	if(Array.isArray(handlers)){
		handlerCount = handlers.length;
		while(handlerCount--){
			if(handlers[handlerCount].node == element){
				handlers[handlerCount].node.removeEventListener(eventName, handlers[handlerCount].callback);
				handlers.splice(handlerCount, 1);
			}
		}
	}
};
$v.View.prototype._removeAllEventsOfElement = function(element){
	for(var eventName in this._handlers){
		if(this._handlers.hasOwnProperty(eventName)){
			this._removeAllHandlersOfElement(element, eventName);
		}
	}
};
// @memberOf View - add model listener
// @param {String} property - model field
// @param {Function} callback 
$v.View.prototype.listen = function(property, callback){
	this.model && this.model.on(property, callback.bind(this));
};
$v.View.prototype.remove = function(){
	this.destroy();
	$4.removeNode(this.el);
};

var $helpers = {
	debounce: function(func, wait, immediate){
		var _timeout;
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
	},
	escapeMap: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;'
	},
	unescapeMap: {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#x27;': "'"
	},
	escape: function(str){
		return str ? str.replace(/[<>&"']/g, function(m){
			return this.escapeMap[m];
		}.bind(this)) : '';
	},
	unescape: function(str){
		return str.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;)/g, function(m){
			return this.unescapeMap[m];
		}.bind(this));
	},
	supplant: function(template, o){
		return template.replace(/{([^{}]*)}/g, function(a, b){
			var r = (b[0] == '=') ? $helpers.escape(o[b.substring(1)]) : o[b];
			return r != null ? r : '';
		});
	},
	htmlspecialchars: function(str){
		return str ? str.replace(/[<>&]/g, function(m){
			return this.escapeMap[m];
		}.bind(this)) : '';
	},
};