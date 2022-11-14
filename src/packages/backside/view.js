const $helpers = require('utils');

function View(options){
	this.controls = Object.create(null);
	this._handlers = {};
	this.initialize(options || {});
}
View.prototype.initialize = function(options){
	if(options.el){
		this.el = options.el;
	}else{
		this.el = document.createElement(options.tagName || this.tagName || 'div');
		this.el.className = options.className || this.className || '';
	}
	this.model = options.model;
	this.render();
};
// create el node if it necessery 
View.prototype.render = function(){
	if(typeof(this.template) == 'string'){
		if(this.model){
			this.el.innerHTML = $helpers.supplant(this.template, this.model.attr);
		}else{
			this.el.innerHTML = this.template;
		}
	}
	this.bindByData(this.el);
};
// @memberOf {View} - remove events and controls
View.prototype.destroy = function(){
	this.off();
	this.controls = null;
};
View.prototype.bindByData = function(root){
	var		$nodes = (root || document).querySelectorAll('[data-co]');
			
	for(var i = $nodes.length - 1, field, $node; $node = $nodes[i], i >= 0; i--){
		field = ($node.dataset.co || 'root').replace(this.dashedToCamel_r, this._dashedToCamel);
		this.controls[field] = $node;
	}
};
View.prototype.dashedToCamel_r = /-(\w)/g;
View.prototype._dashedToCamel = function(str, p1, offset, s) {
	 return p1.toUpperCase();
};

// @param {Element} elem
// @param {String} event
// @param {Function} cb
View.prototype.on = function(elem, event, cb){
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
		console.warn('Can`t attach an event handler to undefined node');
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
View.prototype.off = function(){
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
View.prototype._removeAllHandlersOfElement = function(element, eventName){
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
View.prototype._removeAllEventsOfElement = function(element){
	for(var eventName in this._handlers){
		if(this._handlers.hasOwnProperty(eventName)){
			this._removeAllHandlersOfElement(element, eventName);
		}
	}
};
// TODO ANTIPATTERN
// @memberOf View - add model listener
// @param {String} property - model field
// @param {Function} callback 
View.prototype.listen = function(property, callback){
	var cb = callback.bind(this);
	if(this.model) this.model.on(property, cb);
	return cb;
};
View.prototype.remove = function(){
	this.destroy();
	this.el.remove();
};
View.prototype._prebindEvents = function(conf){
	var 	events = conf || this.events,
				control, eventName, pos, 
				_cache = [];

	for(var key in events){
		pos = key.indexOf(' ');

		if(~pos){
			eventName = key.substr(0, pos++);
			control = this.controls[key.substr(pos)];
		}else{
			eventName = key;
			control = this.el;
		}

		if(control){
			control[eventName] = events[key].bind(this);
			_cache.push(control, eventName);
		}
	}
	
	return function(){
		var i = _cache.length;
		
		while(i-=2){
			if(_cache[i-1]) _cache[i-1][_cache[i]] = null;
		}
		_cache.length = 0;
		_cache = null;
	};
};

module.exports = View;
