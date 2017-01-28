/* Backside  v17 2016/12/19 (based on 2016/08/15) */
;(function(_env){
//==================================
// Events
//==================================
{
	function Events(){
		this._handlers = Object.create(null);
	};
	// @memberOf Events - execute event callbacks
	// @param {Object} options - event options
	// @return {Bool} - if true - stop event propagation
	Events.prototype.trigger = function(){
		var		args = Array.prototype.slice.call(arguments), 	
				handlers = this._handlers[args.shift()],
				i;

		if(Array.isArray(handlers)){
			i = handlers.length;
			while(i-- > 0){
				if(handlers[i].apply(null, args)){
					return true;
				}	
			}
		}
		return false;
	};
	// @memberOf {Events} - remove all event listeners
	Events.prototype.destroy = function(){
		for(var key in this._handlers){
			this.off(key);
		}
	};
	// @memberOf {Events} - attach callback on change
	// @param {String} name - property of model
	// @param {Function} cb - callback
	Events.prototype.on = function(name, cb){
		if(!Array.isArray(this._handlers[name])){
			this._handlers[name] = [];
		}
		this._handlers[name].push(cb);
	};
	// @memberOf {Events} - deattach event
	// @param {String} name - property of model
	// @param {Function} cb - callback
	Events.prototype.off = function(name, cb){
		var handlers = this._handlers[name];
		
		if(Array.isArray(handlers)){
			if(cb){
				var pos = handlers.indexOf(cb);
				pos != -1 && handlers.splice(pos, 1);

				if(handlers.length == 0){
					delete this._handlers[name];
				}
			}else{
				handlers.length = 0;
				delete this._handlers[name];
			}
		}
	};
	// @memberOf {Events} - remove all event listeners
	Events.prototype.destroy = function(){
		this._handlers = Object.create(null);
	};
	// @memberOf {Events} - attach callback on change
	// @param {String} name - property of model
	// @param {Function} cb - callback
	// @return {Function} handler
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
}
//==================================
// Model2 (Native observable model)
// Depricated  since Chrome 49 https://developers.google.com/web/updates/2016/02/chrome-49-deprecations
//==================================
/*{
	// var user = new Model({
	// 	nick: 1,
	// });
	// user.on('change:name', function(value, obj, oldValue){
	// 	console.log('Update name to `%s`', value);
	// })	
	function Model2(defaults){
		Events.call(this);
		this.attr = defaults || {};

		Object.observe(this.attr, function(e){
			console.log('Observered:');
			console.dir(e);
			if(e[0]){
				this.trigger('change:' + e[0].name, e[0].object[e[0].name], e[0].oldValue);
			}
		}.bind(this));
	}
	Model2.prototype = Object.create(Events.prototype);
	Model2.prototype.constructor = Events;
	Model2.prototype.destroy = function(){
		this.trigger('destroy');
		for(var key in this.attr){
			delete this.attr[key];
		}
		Events.prototype.destroy.call(this);
	};
}*/
//==================================
// Waterfall
//==================================
{
	function Waterfall(){
		this.taskList = [];
	}
	Waterfall.prototype.add = function(cb){
		this.taskList.push(cb);	
	};
	Waterfall.prototype.prepend = function(cb){
		this.taskList.unshift(cb);	
	};
	Waterfall.prototype.resolve = function(data, $scope){
		var task = this.taskList.shift();
		
		if(task){
			task(this.resolve.bind(this), data, $scope);
		}	
	};
}
//=========================================
// Dependencies provider
//=========================================
{
	// var dp = new Deprovider();
	// dp.define(function MessageDispatcher(){
	// 	function Dispatcher(){
	// 		Events.call(this);
	// 		chrome.runtime.onMessage.addListener(function(req, sender, res){
	// 			this.trigger(req.action, req, res, sender);
	// 			return true;
	// 		}.bind(this));
	// 	}
	// 	Dispatcher.prototype = Object.create(Events.prototype);
	// 	Dispatcher.prototype.constructor = Events;
		
	// 	return  Dispatcher;
	// });

	function Deprovider(){
		this.stack = Object.create(null);
		this.dependencies = {};
		this.cache = {};
	}
	Deprovider.prototype = {
		define: function(){
			var 	dependencies, constructor;

			if(arguments.length == 2){
				dependencies = arguments[0];
				constructor = arguments[1];
			}else{
				constructor = arguments[0];
			}

			if(constructor && constructor.name){
				this.stack[constructor.name] = constructor;
				
				if(Array.isArray(dependencies)){
					this.dependencies[constructor.name] = dependencies;
				}
			}
		},
		require: function(name){
			if(this.cache[name]){
				return this.cache[name];
			}else if(this.stack[name]){
				var 	constr = this.stack[name],
						deps,
						i;

				if(deps = this.dependencies[name]){
					i = deps.length;
					while(i-- > 0){
						deps[i] = this.require(deps[i]);
					}
				}

				return this.cache[name] = constr.apply(null, deps);
			}
		}
	}
}
//==================================
// Model
//==================================
{
	var Model = function(attr){
		Events.call(this);
		this.attr = attr || Object.create(null);
	}
	Model.prototype = Object.create(Events.prototype);
	Model.prototype.constructor = Events;
	Model.prototype.set = function(){
		if(arguments.length == 2){
			this.attr[arguments[0]] = arguments[1];
		}else{
			var 	collection = arguments[0],
					key;

			for(key in collection){
				this.attr[key] = collection[key];
			}
		}
	};
	Model.prototype.change = function(){
		this.changed = {};
		this.previous = {};

		if(arguments.length == 2){
			this.previous[arguments[0]] = this.attr[arguments[0]];
			this.attr[arguments[0]] = arguments[1];
			this.changed[arguments[0]] = arguments[1];
			this.trigger('change:' + arguments[0], arguments[1], this);
		}else{
			var 	collection = arguments[0],
					key;

			for(key in collection){
				this.previous[key] = this.attr[key];
				this.attr[key] = collection[key];
				this.changed[key] = collection[key];
				this.trigger('change:' + key, collection[key], this);
			}
		}
		this.trigger('change', this);
	};
	Model.prototype.get = function(key){
		return this.attr[key];
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
	// @param {Object} map - exported fields
	// @param {Object} dest
	Model.prototype.export = function(map, dest){
		var 	out = dest || {},
				key;

		if(Array.isArray(map)){
			key = map.length;
			while(key-- > 0){
				if(this.has(map[key])){
					out[map[key]] = this.get(map[key]);		
				}
			}
		}else{
			for(key in map){
				if(this.has(map[key])){
					out[key] = this.get(map[key]);
				}
			}	
		}
		
		return out;
	}
}
//==================================
// DeepModel
//==================================
{
	// Model with nested objects support
	var DeepModel = function(attr){
		Events.call(this);
		this.attr = attr || Object.create(null);
	}
	DeepModel.prototype = Object.create(Events.prototype);
	DeepModel.prototype.constructor = Events;
	DeepModel.prototype.SPLITTER = '.';
	// @memberOf {DeepModel} - set value to model attribute without event triggering
	// @param {String} name (can be like 'user.group.id')
	// @param {*} value
	DeepModel.prototype.set = function(name, value){
		var 	prev;

		if(~name.indexOf(this.SPLITTER)){
			var 	parts = name.split(this.SPLITTER),
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
	// @param {Bool} silent
	DeepModel.prototype.change = function(name, value){
		var 	root = this.attr,
				seg = name,
				prev = this.attr[name],
				split = this.SPLITTER,
				stack = [];

		if(~name.indexOf(split)){
			var 	parts = name.split(split),
					len = parts.length;
					
			name = '';		
			for(var i = 0; seg = parts[i], i < len - 1; i++){
				if(!root[seg]){
					root[seg] = {};
				}
				name += (i ? split : '') + seg;
				stack.push(name, root[seg]); // don't send `root` link because it can be ovverided 
				root = root[seg];
			}
			prev = root[seg];
			root[seg] = value;
			name += split + seg;
			this.trigger('change:' + name, value, this, prev);
			// notification of parent objects about change
			for(var i = stack.length - 1; i > -1; i -= 2){
				this.trigger('change:' + stack[i-1], stack[i], this);
			}
		}else{
			root[seg] = value;
			this.trigger('change:' + name, value, this, prev);
		}
	};
	// @memberOf {DeepModel}
	// @param {String} name,
	DeepModel.prototype.get = function(name){
		if(~name.indexOf(this.SPLITTER)){
			var 	names = name.split(this.SPLITTER),
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
	// model.update('prop1.prop2.prop3', list => list.push('abc'))
	DeepModel.prototype.update = function(prop, cb){
		this.set(prop, cb(this.get(prop), this));
	}
}
//==================================
// Helpers
//==================================
{
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
		// Used only at syntaxis higlighter
		htmlspecialchars: function(str){
			return str ? str.replace(/[<>&]/g, function(m){
				return this.escapeMap[m];
			}.bind(this)) : '';
		},
	};
}
//==================================
// View
//==================================
{
	var View = function(options){
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
		var		pos,
				$nodes = (root || document).querySelectorAll('[data-co]');
				
		for(var i = $nodes.length - 1, field, $node; $node = $nodes[i], i >= 0; i--){
			field = ($node.dataset.co || 'root').replace(this.CATCH_DEFIS, this._replaceDefis);
			this.controls[field] = $node;
		}
	};
	View.prototype.CATCH_DEFIS = /-(\w)/g;
	View.prototype._replaceDefis = function(str, p1, offset, s) {
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
	// @memberOf View - add model listener
	// @param {String} property - model field
	// @param {Function} callback 
	View.prototype.listen = function(property, callback){
		this.model && this.model.on(property, callback.bind(this));
	};
	View.prototype.remove = function(){
		this.destroy();
		$4.removeNode(this.el);
	};
}

_env.Backside = {
	Events: Events,
	// Model2: Model2,
	Model: Model,
	DeepModel: DeepModel,
	Waterfall: Waterfall,
	Deprovider: Deprovider,
	_: $helpers,
	View: View,
	extend: function(Constructor, Base){
		Constructor.prototype = Object.create(Base.prototype);
		Constructor.prototype.constructor = Base;
		return Constructor;
	}
};
}(this));
