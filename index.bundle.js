(new(class{
  constructor(modules, environment, dir, localRepo){
    this._modules = modules;
    this._stack = {};
    this._global = environment;
    this._dir = dir;
    this._localRepo = localRepo;
  }
  _executeModule(moduleId){
    const modId = this.constructor._path2id(moduleId);
    
    if (this._stack.hasOwnProperty(modId)) this._stack[modId]();
    if (!this._modules.hasOwnProperty(modId)) {
      throw('Dependency "%s" was not resolved'.replace('%s', modId));
    } else {
      
      this._modules[modId].call(this._global, this.$module(modId), this.$require(this._dir[modId], this._localRepo));
    }
    
    return this._stack[modId]();
  }
  $require = (basePath, localRepositoryPath) => {
    return moduleId_s => {
      const moduleId = this.constructor._mergePaths(basePath, moduleId_s, localRepositoryPath);
      const r = this._executeModule(moduleId);
      return r;
    };
  }
  $module = (path_s) =>{
    const out = {exports:{}};
    this._stack[this.constructor._path2id(path_s)] = function(){return out.exports;};
    return out; 
  } 
  static _path2id(path_s){
    return path_s.replace(/.js$/i,'');
  }
  
  static _mergePaths(basePath_s, path_s, overridedBasePath_s) {
    if (path_s.indexOf('/') === 0 || /^\w\:/.test(path_s)) return path_s;
    
    if (overridedBasePath_s && path_s[0] !== '.') {
      return overridedBasePath_s + '/' + path_s;
    }
    
    const paths = path_s.split('/');
    const bases = basePath_s.split('/');
    if (paths[0] === '.') paths.shift(); 
    let i = 0; 

    while (i < paths.length) {
      if (paths[i] === '.') j++;
      if (paths[i] !== '..') break;
      i++;
    }
    
    if (i > bases.length) return null;
    return bases.slice(0, i > 0 ? -i : bases.length).concat(paths.slice(i)).join('/');
  }
})({"/packages/backside/events":function anonymous(module,require
) {
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

},"/packages/backside/model":function anonymous(module,require
) {
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

},"/app/source/DocumentModel":function anonymous(module,require
) {
const BacksideModel = require('../../packages/backside/model');

//==========================================
// DocumentModel 
//==========================================
class DocumentModel extends BacksideModel {
		constructor(conf){
			super(conf);
			this.attr.blocks = conf.blocks || {};
		}
		getPresentationID(){
			return this.get('id') + '-' + this.get('mime');
		}
		createCodeBlock(code){
			var id = this.genearateId();

			this.attr.blocks[id] = code;
			return id;
		}
		genearateId(){
			var r = ~~(Math.random() * 100000000);

			return this.attr.blocks[r] != undefined ? this.genearateId() : r;
		}
		getSource(text){
			var 	code = text != undefined ? text : this.get('content'),
						_blocks = this.get('blocks'),
						_isNeedContinue = false;

			this._hiddenBlockPattern.lastIndex = 0;

			code = code.replace(this._hiddenBlockPattern, function(sub, blockCode){
				_isNeedContinue = true;
				return _blocks[blockCode];
			});

			// resolve nested hidden blocks
			return _isNeedContinue ? this.getSource(code) : code;
		}
};

DocumentModel.prototype._hiddenBlockPattern = /\%b(\d+)b\%/g;
DocumentModel.prototype._hiddenLinePattern = /^\%b(\d+)b\%$/;
DocumentModel._exportedProperties = ['title', 'mime', 'content', 'blocks'];

module.exports = DocumentModel;

},"/app/source/instances.axios":function anonymous(module,require
) {
const endpoints = {
  docStorage: window.axios.create({
    baseURL: 'https://nm-test-apps.firebaseio.com/',
  }),
};

endpoints.docStorage.defaults.headers.post['Content-Type'] = 'application/json';

module.exports = endpoints;

},"/packages/backside/utils":function anonymous(module,require
) {
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
  parseQuery: function(query){
    var 	parts = (query || window.location.search.substr(1)).split('&'),
					pos, key, value,
					i = parts.length,
					out = Object.create(null);

    while(i-- > 0){
      key = parts[i];
      pos = key.indexOf('=');

      if(pos != -1){
        value = key.substr(pos + 1);
        key = key.substr(0, pos);
      }else{
        value = null;
      }
      out[key] = value;
    }
    return out;
  },
  saveParse: function(str){
    try{return JSON.parse(str);}catch(e){}
  },
};

module.exports = $helpers;

},"/app/source/LimitedStack":function anonymous(module,require
) {
// for exctracting items use pop() method
	
class LimitedStack extends Array {
  add(item) {
    this.push(item);
    
    if (this.length > this.MAX_STACK_SIZE) {
      this.splice(0, this.length - this.MAX_STACK_SIZE);
    }
  }
} 

LimitedStack.prototype.MAX_STACK_SIZE = 10; 
module.exports = LimitedStack;

},"/app/source/Configs":function anonymous(module,require
) {
function storageAvailable(type) {
  try {
    var storage = window[type],
    x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
  }
}

module.exports = {
  LOCALSTORAGE_AVAILABLE: storageAvailable('localStorage'),
  DEBUG: {
    keyCodes: false,
  },
  isFirefox: typeof(InstallTrigger) !== 'undefined',
  isIE11: !!window.MSInputMethodContext && !!document.documentMode, // This feature does not work in IE11
};

},"/app/source/keycodes":function anonymous(module,require
) {
const KEY = {};
KEY[(KEY[9] = 'TAB')] = 9;
KEY[(KEY[13] = 'ENTER')] = 13;
KEY[(KEY[37] = 'LEFT')] = 37;
KEY[(KEY[66] = 'B')] = 66;
KEY[(KEY[68] = 'D')] = 68;
KEY[(KEY[71] = 'G')] = 71;
KEY[(KEY[76] = 'L')] = 76;
KEY[(KEY[79] = 'O')] = 79;
KEY[(KEY[85] = 'U')] = 85;
KEY[(KEY[89] = 'Y')] = 89;
KEY[(KEY[90] = 'Z')] = 90;
KEY[(KEY[191] = 'SLASH')] = 191;
KEY[(KEY[222] = 'QUOTE')] = 222;
module.exports = KEY;

},"/app/source/HtmlEditor.keybindings":function anonymous(module,require
) {
function stringQuoting(quotaChar) {
  return function(self, posData){
    let text = self.el.textContent;
    let borders = self._getBordersOfContextLine(posData, text);
    let isQuoted = borders.fragment[0] === quotaChar;
    
    if (isQuoted) {
      borders.fragment = borders.fragment.substring(1, borders.fragment.length - 1);
    } else {
      borders.fragment = quotaChar + borders.fragment + quotaChar;
    }
    
    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  }
}

const KEY_BINDINGS = {
  'CTRL_SHIFT_D': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    return {
      text: text.slice(0, borders.start) + borders.fragment + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start + borders.fragment.length,
      end: borders.end + borders.fragment.length
    };
  },
  'ALT_L': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    borders.fragment = borders.fragment.toLowerCase();
    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start, 
      end: borders.start + borders.fragment.length
    };
  },
  'ALT_G': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    borders.fragment = borders.fragment.toUpperCase();
    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  'ALT_B': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    if (self._hooks.ALT_B) borders.fragment = self._hooks.ALT_B(borders.fragment);

    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  'ALT_U': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    if(self._hooks.ALT_U) borders.fragment = self._hooks.ALT_U(borders.fragment);

    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  // Open all brackets in selected text
  ALT_O: function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    borders.fragment = self.model.getSource(borders.fragment);

    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  'CTRL_SLASH': function(self, posData){
    if(self._hooks.CTRL_SLASH){
      var 	text = self.el.textContent,
            start = posData.end - posData.size;
            end = posData.end;

      if(text.charAt(end - 1) == '\n' && start != end) end--; // if range end on \n - cut it out
      if(text.charAt(start) == '\n' && start == end) start--;

      var 	topBorder = text.lastIndexOf('\n', start),
            bottomBorder = text.indexOf('\n',end),
            fragment;

      if (topBorder == -1) {
        topBorder = 0;	
      } else {
        topBorder++;	
      } 
      if (bottomBorder == -1) bottomBorder = text.length - 1;

      fragment = self._hooks.CTRL_SLASH(text.substring(topBorder, bottomBorder));

      return {
        text: (text.slice(0, topBorder) + fragment.text + text.slice(bottomBorder)),
        start: posData.size == 0 ? (posData.end + fragment.offset) : topBorder,
        end: posData.size == 0 ? (posData.end + fragment.offset) : (topBorder + fragment.text.length)
      };
    }
  },
  ALT_QUOTE: stringQuoting('\''),
  SHIFT_ALT_QUOTE: stringQuoting('\"'),
};

KEY_BINDINGS['CTRL_Z'] = function(self){
  console.log('UNDO');
  console.dir(self._history);

  var historyPoint = self._history.pop();

  // TODO first historyPoint unshift to `history redo list`
  // TODO add second List `redoList` at history



  if (historyPoint = self._history.pop()) { // second pop
    let 	sel = window.getSelection();

    console.log('historyPoint');
    console.dir(historyPoint);
    
    // TODO move current state at variant list (redo list for Ctrl-Y)
    // sel.removeAllRanges();
    // self.setText(historyPoint.text);
    // sel.addRange(self.createRange(self.el, historyPoint.start, historyPoint.end));
    return historyPoint;
  } else {
    console.warn('History is empty');
  }
};

KEY_BINDINGS['CTRL_Y'] = function(self){
  console.log('REDO');
  // TODO
};

module.exports = KEY_BINDINGS;

},"/app/lib/each.utils":function anonymous(module,require
) {
function each(collection, callback){
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
};

module.exports = each;

},"/packages/$4/index":function anonymous(module,require
) {
﻿/* 
	$4 v16 2020/03/13
	DOM manipulation library
*/
module.exports = {
	/**
	 * Get html element by id
	 * @param {String} id
	 * @return {HTMLElement}
	 */
	id: function(id){
		return document.getElementById(id);
	},
	
	/**
	 * @param {string} text
	 * @return {TextNode}
	 */
	t: function(text){
		return document.createTextNode(text);
	},
	
	/**
	 * To create new HTML Element with options
	 * $4.cr("option","value","email","textContent","Hello")
	 * @param {...string[]}
	 * @return {HTMLElement}
00	 */
	cr: function(){
		if (arguments.length == 0) throw("Don't set Tag name");

		var el = document.createElement(arguments[0]);
		for(var i = 1, m = arguments.length; i < m; i += 2){
			if(arguments[i] && arguments[i + 1]) el[arguments[i]] = arguments[i + 1];
		}
		return el;
	},
	
	/**
	 * Set styles to Html Element
	 * @param {HTMLElement,String, String, ...} - First is Element Node, next coma separated property-name, property-values
	 */
	st: function(){
		if (!(arguments[0] && arguments[0] instanceof HTMLElement)) throw('Arguments must be instanceof HtmlElement');

		var el = arguments[0];
		for(var i = 1, m = arguments.length; i < m; i += 2){
			if (arguments[i]) el.style[arguments[i]] = arguments[i + 1] || '';
		}
	},
	
	/**
	 * @param {Node} node
	 * @param {String} selector -ccss selector
	 * @param {Bool} getAll - get all results or first related
	 * @return {NodeList|Node}
	 */
	select: function(selector, getAll, node){
		return (node || document)[getAll ? 'querySelectorAll' : 'querySelector'](selector);
	},
	
	/**
	 *
	 */
	emptyNode: function(node){
		var 	i = node.childNodes.length;

		while (i-- > 0){
			node.removeChild(node.childNodes[i]);
		}
		return node;
	},
	
	/**
	 *
	 */
	removeNode: function(node){
		if(!node || !node.parentNode) return;
		node.parentNode.removeChild(node);
	},
	
	/**
	 * @param {Node} parent
	 * @param {Node} node
	 * @return {Node} node
	 */
	prepend: function(parent, node){
		if (parent.firstChild) {
			parent.insertBefore(node, parent.firstChild);
		} else {
			parent.appendChild(node);
		}
		return node;
	},

	/**
	 *
	 */
	appendAfter: function(after, node){
		if (after.nextSibling) {
			after.parentNode.insertBefore(node, after.nextSibling);
		} else {
			after.parentNode.appendChild(node);
		}
		return node;
	},
	
	/**
	 * set Data attribute to node
	 * @param {HtmleElement} node
	 * @param {String} field 
	 * @param {String} value
	 */
	setDataValue: function(node,field,value){
		var 	attrField = 'data-' + field.replace(/([A-Z])/g,function(str,p){return '-' + p.toLowerCase();}),
				dataField = field.replace(/-(\w)/g, function(str, p){return p.toUpperCase();});	

		node.dataset[dataField] = value;
		node.setAttribute(attrField,value);
	},
	
	/**
	 *
	 */
	parentByTag: function(node, tagName){
		tagName = tagName.toUpperCase();
		var currentNode = node;
		
		while (currentNode.tagName != tagName && currentNode != document.body){
			currentNode = currentNode.parentNode;
		}
		
		return currentNode != document.body ? currentNode : undefined;
	},
	
	/**
	 * @param {HtmleElement} node
	 * @param {HtmleElement} rootNode
	 * @return {boolean} true if node is child of the rootNode
	 */
	isChildOf: function(node, rootNode){
		var 	currentNode = node;
		
		while(currentNode != rootNode && currentNode != document.body){
			currentNode = currentNode.parentNode;
		}
		
		return currentNode != document.body;
	},
	
	/**
	 *
	 */
	getStyle: function(elem, name) { 
	    if (elem.style && elem.style[name]) {
			return elem.style[name]; 
		} else if (document.defaultView && document.defaultView.getComputedStyle) { // W3C soltion
			name = name.replace(/([A-Z])/g, '-$1').toLowerCase(); // 'textAlign' -> 'text-align' 
			var s = document.defaultView.getComputedStyle(elem, ''); 
			return s && s.getPropertyValue(name); 
		} else if (elem.currentStyle && elem.currentStyle[name]) { // IE fix
			return elem.currentStyle[name]; 
	    } else { 
	       return null; 
		}
	},
	
	/**
	 *
	 */
	removeNodes: function(nodeList){
		var len = nodeList.length;
		
		while(len-- > 0) {
			this.removeNode(nodeList[len]);
		}
	},
	
	/**
	 * @memberOf $4 - parse selector string
	 * @param {HtmlElement} node
	 * @return {Object}
	 */
	_parseSel: function(selector){
		var 	parts = selector.split(/(#|\.)/g),
				pos = 0,
				res = {cls: [], id: '', tagName: ''};
		
		if (parts[pos] != '#' && parts[pos] != '.') {
			res.tagName = parts[pos].toUpperCase();
			pos++;
		}
		
		for (; pos < parts.length; pos += 2) {
			if (parts[pos] == '#') {
				res.id = parts[pos + 1];
			} else {
				res.cls.push(parts[pos + 1]);
			}
		}
		return res;
	},
	
	/**
	 * @memberOf $4
	 * @param {HtmlElement} node
	 * @param {String} selector
	 * @return {HtmlElement|undefined}
	 */
	closest: function(node, selector){
		var 	conf = this._parseSel(selector),
				currentNode = node, 
				fail;
		
		while(currentNode.parentNode != undefined){
			if(conf.id && currentNode.id != conf.id){
				currentNode = currentNode.parentNode;
				continue;
			}

			if(conf.tagName && currentNode.tagName != conf.tagName){
				currentNode = currentNode.parentNode;
				continue;
			}

			if(conf.cls.length){
				fail = false;
				for(var i = 0; i < conf.cls.length; i++){
					if(!currentNode.classList.contains(conf.cls[i])){
						fail = true;
					}
				}
				if(fail){
					currentNode = currentNode.parentNode;
					continue;
				}
			}
			
			return currentNode;
		}
		return undefined;
	},
	
	/**
	 *
	 */
	siblings: function($node, cb){
		var 	$list = $node.parentNode.children,
				len = $list.length;

		while(len--){
			if($list[len] != $node){
				cb($list[len], $node.parentNode);
			}
		}
	},
	
	/**
	 * @param {Object} cssObj - css property map
	 */
	css: function($node, cssObj){
		for(var key in cssObj)
			if(cssObj.hasOwnProperty(key)){
				$node.style[key] = cssObj[key];	
			}
		return $node;
	}
};

},"/app/source/ProjectModel":function anonymous(module,require
) {
const DocumentModel = require('./DocumentModel');
const BacksideModel = require('../../packages/backside/model');
const AxiosInstances = require('./instances.axios');

const PROP_RDOCID = 'remoteDocId';
const PROP_COUNTER = 'counter';
const PROP_OPENED = 'opened_ids';
const PROP_DOCS = 'docs';

class ProjectModel extends BacksideModel {
  /**
   * @param {Object} conf
   * @param {string[]} conf.opened_ids
   * @param {number} conf.counter
   * @param {string} conf.remoteRefId
   */

	constructor(conf) {
		super(conf);
		if (!Array.isArray(conf[PROP_OPENED])) this.set(PROP_OPENED, []);
		const docs = this.get(PROP_DOCS);
		const docIdList = Object.keys(docs);
		const maxIndex = docIdList.length > 0 ? Math.max.apply(null, docIdList.map(num => parseInt(num, 10))) + 1 : 0;
		this.set(PROP_COUNTER, maxIndex);

		if (!conf.hasOwnProperty(PROP_RDOCID)) this.set(PROP_RDOCID, 0);
		this.docIDMap = {};
		
		for(let id in docs){
			this._add(new DocumentModel(docs[id]), id);
		}
	}
  
	_add(model, id) {
		var id = id || this.attr[PROP_COUNTER]++ + '';

		this.attr[PROP_DOCS][id] = model;
		model.set('id', id);
		this.docIDMap[model.get('title')] = id;
		this.trigger('add', model, this);
	}
  
	add(list){
		var  	i = list.length;

		while(i-- > 0){
			this._add(list[i]);
		}
	}
	
	_markSpaceAsClosed(docId) {
		var pos = this.attr[PROP_OPENED].indexOf(docId);
		if (pos < 0) return;
		this.attr[PROP_OPENED][pos] = null;
	}
  
	spaceChange(spaceId, docId){
		if (Array.isArray(this.attr[PROP_OPENED])) {
			this._markSpaceAsClosed(docId);
			this.attr[PROP_OPENED][spaceId] = docId;
		}
		this.trigger('spaceChange');
	}
  
	closeSpace(docId){
		this._markSpaceAsClosed(docId);
		this.trigger('spaceChange');
	}
	
  createProjectSnapshot() {
		let docs = this.get('docs');
    let id;
		let prj = {
			model: {
				[PROP_DOCS]: {},	
			},
		};

		this.export(ProjectModel.EXPORTED_PROPERTIES, prj.model);

		for(id in docs){
			prj.model[PROP_DOCS][id] = docs[id].export(DocumentModel._exportedProperties);
		}
    
		return prj;
	}
	
	static createEmpty(){
		return new ProjectModel({
			[PROP_RDOCID]: null,
			[PROP_COUNTER]: 0,
			title: '',
			gridId: '7', // the layout grid
			[PROP_OPENED]: Array(4), // Opened documents
			current_doc: 0, // id of the focused doc
			[PROP_DOCS]: {}
		});
	}	

	save(){
		const snapshot = this.createProjectSnapshot();
    
    AxiosInstances.docStorage.post('docs.json', snapshot)
      .then((resp) => {
				this.change(PROP_RDOCID, resp.data.name);
      }, (error) => {
				console.log('Error');
				console.dir(error);
      });
	}

	/**
	 * @param {string} projectId
	 * @return {Promise<Object>}
	 */
	static load(projectId){
		return AxiosInstances.docStorage.get(`/docs/${projectId}/.json`);
	}
  
}

ProjectModel.EXPORTED_PROPERTIES = ['current_doc', 'opened_ids', 'title', 'blocks', PROP_COUNTER, PROP_RDOCID];

module.exports = ProjectModel;
  

},"/packages/backside/view":function anonymous(module,require
) {
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

},"/app/source/HtmlEditor":function anonymous(module,require
) {
const LimitedStack = require('./LimitedStack');
const { DEBUG } = require('./Configs');
const config = require('./Configs');
const KEY = require('./keycodes');
const KEY_BINDINGS = require('./HtmlEditor.keybindings');

	
function HtmlEdit($pre, engine, conf, model){
  this.el = $pre;
  this.el.contentEditable = true;
  this._handlers = Object.create(null);
  this._hooks = {};
  this.init();

  this.engine = engine;
  this._conf = conf;
  this.model = model;

  this._history = new LimitedStack();
}
HtmlEdit.prototype.key_bindings = KEY_BINDINGS;

HtmlEdit.prototype.events = {
  //// ovveride [Enter] and [TAB] keys, without firing oninput event
  keydown: function(e){
    if (DEBUG.keyCodes) {
      console.log('Key: %s', e.keyCode);
      console.dir(e);	
    }

    if (e.keyCode === KEY.ENTER || e.keyCode === KEY.TAB || e.keyCode === 46) { // Default actions on keys
      // #13 - prevent [Enter] browsers inserting <div>, <p>, or <br> on their own
      // #9 - prevent [Tab]
      // by default by [Enter] removing selection
      let		posData = this.getSelection(),
            pos = posData.end,
            text;

      if (posData.size == 0) { //// if cursor without selection
        e.preventDefault(); //// don't fire oninput event!
        text = this.el.textContent;

        if (e.keyCode == KEY.ENTER) {
          //// detect how many \t was at previous line 
          let 	prevNewLinePos = text.lastIndexOf('\n', pos - 1) + 1, //// Attention: don't fix `-1` value because position index and cursur position shifted on one item.
                tabStr = '';

          while (prevNewLinePos < pos) {
            if (text[prevNewLinePos] == '\t') {
              tabStr += '\t';
              prevNewLinePos++;
            } else {
              break;
            }
          }

          text = text.slice(0, pos) + '\n' + tabStr + (text.slice(pos) || ' ');
          pos += tabStr.length;
        } else if (e.keyCode == KEY.TAB) {
          let tab = this._getTab();
          text = text.slice(0, pos) + tab + (text.slice(pos) || ' ');

          pos += tab.length -1;
        } else if(e.keyCode == 46) { // This hook for html editor. Fix removing of empty node
          text = text.slice(0, pos) + (text.slice(pos + 1) || ' ');
          pos--;
        }

        posData.sel.removeAllRanges();
        this.setText(text);
        
        if (config.isIE11) { // FOR IE
          this.setSelectionRange(this.el, pos + 1); // this.el.childNodes[0], pos
          let range = this.setCaretPos(pos + 1);
          posData.sel.addRange(range);
        } else {
          posData.sel.addRange(this.setCaretPos(pos + 1));
        }
        
        // Disabled
        // this._history.add({
        //   text,
        //   start: pos + 1,
        //   end: pos + 1,
        // });
      } else { // Ovveride moving lines by tab
        if(e.keyCode == KEY.TAB){ // Catch TAB
          e.preventDefault(); //// don't fire oninput event!

          text = this.el.textContent;
          let start = posData.end - posData.size;
          let selectedText = text.substring(start, pos);

          if (selectedText.indexOf('\n') == -1) { // if new lines not founded just replace selected on \t
            // text = text.slice(0, start) + '\t' + (text.slice(pos) || ' ');
            // pos -= selectedText.length - 1; // less on one because we replace on single char \t
            let tab = this._getTab();
            text = text.slice(0, start) + tab + (text.slice(pos) || ' ');
            pos -= selectedText.length - tab.length; // less on one because we replace on single char \t

            posData.sel.removeAllRanges();
            this.setText(text);
            posData.sel.addRange(this.setCaretPos(pos));
          } else {
            let 	head = text.slice(0, start),
                  lastLinePos = head.lastIndexOf('\n'),
                  lines,
                  diff = text.length;

            // start position will change
            start = lastLinePos != -1 ? lastLinePos : 0;
            selectedText = text.substring(start, pos);

            if (e.shiftKey) { // move selected to left
              lines = selectedText.split('\n').map(function(str){return (str.charCodeAt(0) == 9 || str.charCodeAt(0) == 32) ? str.substring(1) : str;});
              text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
            } else { // move selected to right
              let tab = this._getTab();
              lines = selectedText.split('\n').map(function(str){return str.length > 0 ? tab + str : str;});
              text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
            }
            diff -= text.length;
            pos -= diff;

            posData.sel.removeAllRanges();
            this.setText(text);

            let range = this.createRange(this.el, (start > 0 ? start + 1 : 0), pos);

            posData.sel.addRange(range);
          }
        }
      }
    } else if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      
      // This condition must be after [TAB] handler because it ovverides lines shifting with [Shift] key
      if (KEY[e.keyCode]) {
        let 	combination = ((e.ctrlKey || e.metaKey) ? 'CTRL_' : '') + (e.shiftKey ? 'SHIFT_' : '') + (e.altKey ? 'ALT_' : '') + KEY[e.keyCode],
              handler = this.key_bindings[combination],
              posData = this.getSelection();

        if (handler) {
          e.preventDefault();
          let historyPoint = handler(this, posData);

          if (historyPoint) {
            posData.sel.removeAllRanges();
            this.setText(historyPoint.text);
            posData.sel.addRange(this.createRange(this.el, historyPoint.start, historyPoint.end));
            // this._history.add(historyPoint);
          }
        }
      }
    }
  },
  //// Force html entities escaping after past events. First important for FF and need at Chrome sometimes.
  //// Attention: Firefox. Paste <br/> beside \n
  //// Attention: clipboardData.getData() can be called only in onpaste event by security reasons
  paste: function(e){
    // Prevent pasting HTML at document
    if (!e || !e.clipboardData || !e.clipboardData.types || !e.clipboardData.getData) return;
    
    e.stopPropagation();
    e.preventDefault();

    let 	pastedData = e.clipboardData.getData('text').replace(/\r/g, ''); // Also available 'text/html'
          posData = this.getSelection(),
          text = this.el.textContent,
          start = posData.end - posData.size,
          end = posData.end;

    if (this._hooks.onpaste) {
      pastedData = this._hooks.onpaste(pastedData);						
    }

    text = text.slice(0, start) + pastedData + text.slice(end);	
    end = start + pastedData.length;	
    posData.sel.removeAllRanges();
    this.setText(text);
    // To stay selected 
    // posData.sel.addRange(createRange(this.el, start, end));
    posData.sel.addRange(this.createRange(this.el, end, end));
  },
  copy: function(e){
    if (!e || !e.clipboardData || !this._hooks.oncopy) return;

    e.stopPropagation();
    e.preventDefault();

    let 	posData = this.getSelection(),
          text = this.el.textContent,
          start = posData.end - posData.size,
          end = posData.end;

    e.clipboardData.setData('text/plain', this._hooks.oncopy(text.substring(start, end)));
  },
  input: function(e){
    const text = this.el.textContent; 
    const selection = this.getSelection();
    const caretPos = selection.end - selection.size;

    this.setText(text);
    selection.sel.removeAllRanges();
    selection.sel.addRange(this.setCaretPos(caretPos));

    setTimeout(() => {
      console.log('INPUT');
      console.dir(selection);
      // TODO add debouncing
      this._history.add({
        text,
        start: selection.end - selection.size,
        end: selection.end
      });
    }, 0);
  }
};

HtmlEdit.prototype.setText = function(text){
  this.el.textContent = text;
};
HtmlEdit.prototype.getText = function(){
  return this.el.textContent;	
};

HtmlEdit.prototype.getSelection = function(){
  var 	sel = window.getSelection(),
        range = sel.getRangeAt(0),
        preCaretRange = range.cloneRange();

  preCaretRange.selectNodeContents(this.el);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  if (config.isIE11){
    let	el = sel.anchorNode,
        pos = sel.anchorOffset;

    while (el.parentNode && el != this.el) {
      while (el.previousSibling) {
        el = el.previousSibling;
        pos += el.textContent.length;
      };
      el = el.parentNode;
    }
    return {
      end: pos,
      size: sel.toString().length, // the length of selected text
      sel: sel,
    };
  } else {
    // Attention: Start can be detected with sel.anchorNode!
    // Attention:
    // Selection size can be detected by `sel.toString().length` and `range.toString().length`. Both of them perfectly work in Chrome
    // But FF doesn't count tab chars in selections at `sel.toString().length`.
    return {
      end: preCaretRange.toString().length, // where selection ends IE11 results is differernt from Chrome (not contains \n)
      // end: preCaretRange.endOffset, // Buggi Work at IE11 and W3C, but without syntax highlighting!

      // Attention!
      // FF bug: lose all tabs inside selection! Табы не учитываются, поэтому может быть меньше реального
      // size: sel.toString().length, // selection length
      size: range.toString().length,
      sel: sel,
      range: range,
    };
  }
};

HtmlEdit.prototype.init = function(){
  var handler;

  for(key in this.events){ // bind events
    handler = this.events[key].bind(this);
    this._handlers[key] = handler;
    this.el.addEventListener(key, handler);
  }
};
HtmlEdit.prototype.debug = function(text){
  return (text || this.el.textContent).replace(/\n/g,'<N>').replace(/\r/g,'<R>').replace(/\t/g,'<T>')
};
HtmlEdit.prototype._getBordersOfContextLine = function(posData, text){
  var 	out = {};

  if(posData.size == 0){ // Get current line
    let borders = this.findLineBorders(text, posData.end);

    out.start = borders.start;
    out.end = borders.end;
  }else{ // get selection
    out.start = posData.end - posData.size;
    out.end = posData.end;
  }
  out.fragment = text.substring(out.start, out.end);

  return out;
};
HtmlEdit.prototype._getTab = function(){
  // TODO set configurable tabSize!
  return true ? '\t' : ' '.repeat(4);
};
HtmlEdit.prototype.destroy = function(){
  var handler;

  for(key in this._handlers){ // unbind events
    handler = this._handlers[key];
    this.el.removeEventListener(key, handler);
  }
  this._handlers = Object.create(null);
};
HtmlEdit.prototype.setCursor = function(pos){
  var sel = window.getSelection();

  sel.removeAllRanges();
  sel.addRange(this.setCaretPos(pos));
};

HtmlEdit.prototype.createRange = function(element, start, end){
  var 	rng = document.createRange(),
        n, o = 0,
        tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, null);

  while(n = tw.nextNode()){
    o += n.nodeValue.length;
     
    if (o >= start) {
      rng.setStart(n, n.nodeValue.length + start - o);
      start = Infinity;
    }

    if (o >= end) {
      rng.setEnd(n, n.nodeValue.length + end - o);
      break;
    }
  }
  return rng;
};
HtmlEdit.prototype.setSelectionRange = function(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  } else if (input.createTextRange) {
    let range = input.createTextRange();

    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
};
HtmlEdit.prototype.findLineBorders = function(text, pos){
  var out = {
    start: text.lastIndexOf('\n', pos - 1),
    end: text.indexOf('\n', pos)
  };
  
  if (!~out.start) { // not found
    out.start = 0;
  } else {
    out.start++;
  }

  if (!~out.end) {
    out.end = text.length; // not found	
  } else {
    out.end++;
  }

  return out;
};

/*
 Solutions:
  // var replacePattern = /([\u0080-\u0400\u04FF-\uFFFF])/g;
  // var replacePattern = /([\u04FF-\uFFFF])/g; 
  code = code.replace(replacePattern, function(s){
    var 	c = s.charCodeAt(0).toString(32), 
          i = 4 - c.length; 

    while(i-- > 0){
      c = '0' + c; 	
    } 
    return '\\u' + c;
  });

*/
HtmlEdit.prototype.setText = function(code){
  this.el.style.whiteSpace = 'pre';

  var 	replacePattern = /(\\u[a-f0-9]{4})/ig,
        count;
  //  To research. Correct paste '\u0410-\u044f' at chrome
  code = code.replace(replacePattern, function(s){
    return '\\u' + s.substring(2);
  });

  if (this.engine && this.engine.prettify) {
    let 	html = this.engine.prettify(code);
    
    count = this.countParts(html, '\n');
    this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
    this.el.innerHTML = html;
  } else {
    count = this.countParts(code, '\n');
    this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
    this.el.textContent = code;
  }
  this._conf.onChange(code);

  return 0;
};
HtmlEdit.prototype.countParts = function(text, subText){
  var 	pos = -2,
        count = -1;

  while(pos != -1){
    pos = text.indexOf(subText, pos + 1);
    count++;
  }
  return count;
};
// TODO use createTreeWalker in the code
// HtmlEdit.prototype.setCaretPos = function(pos){
// 	var 	offset = pos,
// 			$node = this.el,
// 			range = document.createRange(),
// 			$nodes,
// 			i;

// 	while(offset > 0){
// 		$nodes = $node.childNodes;
// 		for(i = 0; i < $nodes.length; i++){
// 			if(offset > $nodes[i].textContent.length){
// 				offset -= $nodes[i].textContent.length;
// 			}else{
// 				$node = $nodes[i];
// 				break;
// 			}
// 		}

// 		if($node instanceof Text){
// 			break;
// 		}
// 	}

// 	range.setStart($node, offset);
// 	range.collapse(true);
// 	return range;
// };
HtmlEdit.prototype.setCaretPos = function(pos){
  var range = this.createRange(this.el, pos, pos);

  range.collapse(true);
  return range;
};

// @param {HtmlElement} node
// @return {Number} pos
HtmlEdit.prototype.getElementPos = function(node){
  let pos = 0;
  let n;
  let symbolstack = [];
  
  if (node.previousSibling) {
    n = node.previousSibling;
    pos = 0;
  } else {
    n = node.parentNode;
  }

  while (n != this.el && n.parentNode) {
    while (n.previousSibling){
      pos += n.textContent.length;
      symbolstack.push(n.textContent);
      n = n.previousSibling;
    }
    pos += n.textContent.length;
    symbolstack.push(n.textContent);
    n = n.parentNode;
  }

  return pos;
};

HtmlEdit.prototype.resetCode = function(code, selectionStartPos, selectionEndPos){
  var sel = window.getSelection();

  sel.removeAllRanges();
  this.setText(code);
  sel.addRange(this.createRange(this.el, selectionStartPos, selectionEndPos));
  this._history.add({
    text: code,
    start: selectionStart,
    end: selectionEnd
  });
};

module.exports = HtmlEdit;

},"/app/source/ExtMimeMap":function anonymous(module,require
) {
module.exports = {
  'htm':   'text/html',
  'html':   'text/html',
  'xml':    'text/xml',
  'svg':    'text/html',
  'css':    'text/css',
  'js':     'application/javascript',
  'json':   'application/json',
  'txt':    'text/plain',
  'po':     'text/gettext',
  'md':     'text/markdown',
};

},"/app/lib/cr":function anonymous(module,require
) {
// ControlKit (Ckit) v8 2016/10/27
/*
  Example:
  document.body.appendChild(
    Cr('div', 'sc_ctx')
      .alias('menu', _co)
      .add(Cr.list(items, function(item) {
        return Cr('div', 'sc_ctx-item', item.label).data('role', item.role);
      }))
      .append('div', 'sc_ctx-item', VOC.remove_document).data('role', 'remove-document').parent()
      .root
  );
*/
(function(_global){
	// @param {String} arg1 - tagName
	// @param {String} className
	// @param {String} text - text content
	// Ovverided
	// @param {Element} arg1 - use node
	function Cr(arg1, className, text){
		if(!(this instanceof Cr)){
			return new Cr(arg1, className, text);
		}

		if(arg1 instanceof Element){
			this.el = arg1;
		}else{
			this.el = document.createElement(arg1);
			if(text) this.el.textContent = text;
			if(className) this.el.className = className;	
		}
		this.root = this.el;
	}
	Cr.prototype.append = function(arg1, className, text){
		var inst = new Cr(arg1, className, text);
		this.el.appendChild(inst.el);
		inst.root = this.root;
		return inst;
	};
	Cr.prototype.node = function(){
		return this.el;
	};
	Cr.prototype.parent = function(){
		if(this.el.parentNode){
			this.el = this.el.parentNode;	
		}
		
		return this;
	};
	// @param {String} arg1 - attribute name
	// @param {String} arg2 - attribute value
	// or
	// @param {Object} arg1 - collection of attributes
	// Attention: NS of property can be determined like 'xlink:href'
	Cr.prototype.attr = function(arg1, arg2){
		if(typeof(arg1) == 'string'){
			this.el.setAttribute(arg1, arg2);
		}else{
			for(var key in arg1){
				this.el.setAttribute(key, arg1[key]);
			}
		}
		return this;
	};
	// Create Alias for DOM element; Bind DOM Element with object property
	Cr.prototype.alias = function(name, collection){
		var co = collection || (this.co = Object.create(null));
		co[name] = this.el;
		return this;
	};
	Cr.prototype.use = function(cb, arg){
		return cb(this, arg), this;
	};
	Cr.prototype.prop = function(){
		for(var i = 0, m = arguments.length; i < m; i += 2){
			if(arguments[i] && arguments[i + 1]){
				this.el[arguments[i]] = arguments[i + 1];
			}
		}
		return this;
	};
	Cr.prototype.add = function(){
		for(var i = 0, len = arguments.length; i < len; i++){
			if (!arguments[i]) continue;
      this.el.appendChild(arguments[i] instanceof this.constructor ? arguments[i].root : arguments[i]);
		}
		return this;
	};
	Cr.prototype.data = function(key, value){
		this.el.setAttribute('data-' + key, value);

		if(this.el.dataset){
			this.el.dataset[key] = value;	
		}
		return this;
	};

	Cr.fr = function(){
		var 	fr = document.createDocumentFragment();

		for(var i = 0, len = arguments.length; i < len; i++){
			if(arguments[i] instanceof Cr){
				fr.appendChild(arguments[i].root);
			}
		}
		return fr;
	};
	Cr.list = function(list, callback){
		var 	fr = document.createDocumentFragment(), 
          i, inst;

		for(i in list){
			inst = callback(list[i], i);
			fr.appendChild(inst instanceof Cr ? inst.root : inst);
		}
		return fr;
	}
	

  if (typeof(module) != 'undefined') {
    module.exports = Cr;
  } else if(_global.DPROVIDER){
		_global.DPROVIDER.define(null, function ControlKit(){
			return Cr;
		});
	}else if(typeof(define) == 'function'){
		define(function ControlKit(){
			return Cr;
		});
	}else{
		_global.Cr = Cr;
	}
}(this));


},"/app/source/vocabulary":function anonymous(module,require
) {
module.exports = {
  create_new_document: 'Create new document',
  file_name: 'Document name:',
  highlighting_type: 'Syntax Highlight:',
  create: 'Create',
  none_syntax_type: 'None',
  load_page_btn: 'Run',
  remove_document: 'Remove document',
  download_document: 'Download document',
  import_from_file: 'Import content from file',
  ok: 'Ok',
  btn_cancel: 'Cancel',
  btn_apply: 'Apply',
  aboutApp: 'About ABC v 0.6a.%d',
  unvalid_json_data: 'Unvalid json data',
  close: 'Close',
  start_test_prj: 'Start test project',
  start_default_prj: 'Start default project',
  start_react_prj: 'Start React project',
  show: 'Show list of hotkeys',
  hide: 'Hide list of hotkeys',
  rename_document: 'Rename document',
  popupRenameDoc_title: 'Rename document \"%s\"',
  popupRenameDoc_fnamePlaceholder: 'New document name',
  // settingDialog_title: 'Settings',
  settingDialog_label_replaceTabBySpace: 'Replace tab by spaces',
  settingDialog_label_tabSize: 'Tab size',
  settingDialog_label_grid: 'Grid',
  settingDialog_label_theme: 'Theme',
  settingDialog_header_contentSettings: 'Content settings',
};

},"/app/lib/PopupBuilder":function anonymous(module,require
) {
const each = require('each.utils');
const BacksideEvents = require('../../packages/backside/events');
const $4 = require('../../packages/$4/index');

class PopupBuilder extends BacksideEvents {
  /**
   * @param {Object} conf.events
   * @param {string} conf.className
   * @param {Object} [extend]
   */
  constructor (conf, extend) {
    super();
    if(extend != null) Object.assign(this, extend);
    this.el = document.createElement('dialog');
    this.el.className = conf.className;
    // this.el.style.display = 'none';
    this.el.setAttribute('tabindex', 0);
    this.initialize(conf);
  }
  
  _replaceDefis(str, p) {return p.toUpperCase();}
  
  _bindByRole($target){
    let roleNodes = ($target || this.el).querySelectorAll('[data-co]');
    let i = roleNodes.length;
    let field;
    
    while(i-- >0){
      field = roleNodes[i].dataset.co.replace(this.CATCH_DEFIS, this._replaceDefis);
      this.controls[field] = roleNodes[i];
    }
  }
  
  _bindEvents(events) {
    var 	pos, controlName, eventName;

    for(var key in events){
      pos = key.indexOf(' ');
      
      if(pos != -1){
        eventName = key.substr(pos + 1);
        controlName = key.substr(0, pos);

        if(this.controls[controlName]){
          this.controls[controlName]['on' + eventName] = events[key].bind(this);
        }
      }
    }
  }
  
  initialize(conf){
    this.children = {};
    this.render(conf);

    if(conf.className) this.el.className = conf.className;
    this.$heap = conf.heap || document.getElementById('node-heap') || document.body;
    this.$heap.appendChild(this.el);

    this.destroyOnClose = conf.destroyOnClose != undefined ? conf.destroyOnClose : true;
    if(conf.css) $4.css(this.controls.content, conf.css);

    setTimeout(function(){
      this.el.focus();
    }.bind(this), 0);
    this.el.onclick = function(e){
      if(this.controls.content.contains(e.target)){
        e.stopPropagation();
      }else{
        this.close();	
      }
    }.bind(this);
    this.el.onkeydown = function(e){
      if(e.keyCode == 27) this.close();
    }.bind(this);
  }
  
  render(conf){
    this.controls = {};
    this.el.innerHTML = this.template.replace('%title%', conf.title || '').replace('%content%', conf.content || '');
    this._bindByRole(this.el);
    if(conf.events) this._bindEvents(conf.events);
  }
  
  remove(){
    this.controls = null;

    each(this.children, function(view){
      view.remove();
    });
    this.el.remove();
    this.model && this.model.off();
    // Remove popup from stack
    var stackPos = this.stack.indexOf(this);
    
    if(stackPos != -1) this.stack.splice(stackPos, 1);

    return this;
  }
  
  open(){
    if(this.onopen) this.onopen(this);
    document.documentElement.style.overflow = 'hidden';
    document.body.overflow = 'hidden';
    this.el.setAttribute('open', true);
    this.stack.push(this);
    return this;
  }
  
  close(status){
    this.onclose && this.onclose(this, status) || this._completeClose();
  }
  
  _completeClose(){
    this.el.removeAttribute('open');
    document.documentElement.style.overflow = '';
    document.body.overflow = '';
    this.destroyOnClose && this.remove();
  }
} 

PopupBuilder.prototype.stack = [], // stack for opened popups
PopupBuilder.prototype.CATCH_DEFIS = /-(\w)/g;
PopupBuilder.prototype.template = 
  '<div class="dwc_popup-wrap">' +
    '<div class="dwc_popup-content" data-co="content">' +
      '<div class="dwc_popup-header" data-co="popup-title">%title%</div>' +
      '<div class="dwc_popup-body clearfix" data-co="body">%content%</div>' +
    '</div>' +
    '<div class="m3_middle_helper"></div>' +
  '</div>';
module.exports = PopupBuilder;

},"/app/source/testProject":function anonymous(module,require
) {
const ProjectModel = require('ProjectModel');
const DocumentModel = require('DocumentModel');

module.exports = function(){
  var projectModel = new ProjectModel({
    title: 'dev',
    opened_ids: ['0', '1', null, '3'],
    current_doc: '0', 
    docs: {},
  });
  projectModel.add([
    {
      title: 'index.html',
      mime: 'text/html',
      content:
        '<!DOCTYPE html>\n' +
        '<html>\n' +
        '	<head>\n' +
        '		<meta charset="utf-8">\n' +
        '		<link rel="stylesheet" type="text/css" href="./style.css"/>\n' +
        '	</head>\n' +
        '	<body>\n' +
        '		<h1 style="">Hello world!</h1>\n' +
        '		<script src="./script.js"></script>\n' +
        '	</body>\n' +
        '</html>\n'
    },
    {
      title: 'style.css',
      mime: 'text/css',
      content: 
        ':root{\n' +
        '	color: #cccccc;\n' +
        '}\n' +
        'html{ font: 13px/18px Arial; }	\n' +
        'body{ margin: 0; }\n' +
        'button, input{ font-family: inherit; }\n' +
        'table{ border-collapse: collapse; }\n' +
        '#id32:not(.abc){ \n' +
        '	width: calc(var(--abc) + 32px); \n' +
        '	margin: -1.31em; /* .25x desired size */ \n' +
        '	height: 5.24em;  /* 2x desired size */ \n' +
        '	width: 5.24em;   /* 2x desired size */ \n' +
        '	transform: scale(.5); \n' +
        '} \n' +
        ''
    },
    {
      title: 'script.js',
      mime: 'application/javascript',
      content: 
        '// single line comment\n' +
        'var lines = selectedText.split(\'\\n\').map(str => str.charCodeAt(0) == 9 ? str.substring(1) : str);\n' +
        '/* Double quoteas comment */ var str = "abc";/* multi\n' +
        '	line\n' +
        'comment	*/\n' +
        'var str = \'abc\';\n' +
        'var str = \'ab\\\n' +
        'c\';\n' +
        ''
    },
    {
      title: 'readme.txt',
      mime: 'text/plain',
      content: 'qwerty\nasdfghjkl\nzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnm\n1234567890123456789012345678901234567890123456789012345678901234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
    },
    {
      title: 'test.xml',
      mime: 'text/xml',
      content: 
          '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"	xmlns:content="http://purl.org/rss/1.0/modules/content/"\n' +
        '	xmlns:wfw="http://wellformedweb.org/CommentAPI/"\n' +
        '	xmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
        '	xmlns:atom="http://www.w3.org/2005/Atom"\n' +
        '	xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n' +
        '	xmlns:slash="http://purl.org/rss/1.0/modules/slash/"\n' +
        '>\n' +
        '<channel>\n' +
        '	<title>Internship &#8211; French Tech Côte d&#039;Azur</title>\n' +
        '	<atom:link href="http://www.clubbusiness06.com/feed/" rel="self" type="application/rss+xml" />\n' +
        '	<description><![CDATA[<p>Vu sur <a rel="nofollow" href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">La Nuit des Associations, samedi 12 novembre 2016 \u00e0 Nice</a></p>\n' +
        '		<p style="font-size:14px; color:#666666; text-align:justify; font-family:Arial, Helvetica, sans-serif;font-weight:bold;">L\u2019engagement associatif est plus que jamais au c\u0153ur de nos pr\u00e9occupations. L\u2019Associatif Azur\u00e9en et ses partenaires s\u2019efforcent tous les ans de mettre en lumi\u00e8re les associations azur\u00e9ennes, leurs initiatives et leur \u0153uvre. <br />\n' +
        '		Pour atteindre cet objectif, l\u2019Associatif Azur\u00e9en, organisera cette ann\u00e9e, en collaboration avec L\u2019Ordre Associatif Mon\u00e9gasque, la 4\u00e8me NUIT DES ASSOCIATIONS, \u00e9dition C\u00f4te d\u2019Azur, le Samedi 12 Novembre 2016 au Palais de la M\u00e9diterran\u00e9e. Ce d\u00eener de gala, dont les b\u00e9n\u00e9fices seront redistribu\u00e9s aux associations azur\u00e9ennes, sera l\u2019occasion d\u2019honorer plusieurs b\u00e9n\u00e9voles, qui se verront remettre les m\u00e9dailles de l\u2019Ordre Associatif Mon\u00e9gasque, afin de r\u00e9compenser leur engagement. Lors de l\u2019\u00e9v\u00e9nement, le troph\u00e9e \u00ab Les Anges du Rocher \u00bb, oscar du secteur associatif, sera remis \u00e0 une association azur\u00e9enne, particuli\u00e8rement m\u00e9ritante, s\u00e9lectionn\u00e9e par notre comit\u00e9.</p>\n' +
        '		<p><a href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">Lire la suite <span class="meta-nav"></span></a></p>\n' +
        '		<p>Cet article <a rel="nofollow" href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">La Nuit des Associations, samedi 12 novembre 2016 \u00e0 Nice</a> est apparu en premier sur <a rel="nofollow" href="http://www.clubbusiness06.com">CLUB BUSINESS 06</a>.</p>\n' +
        '	]]></description>\n' +
        '	<dc:creator><![CDATA[Emmanuel GAULIN]]></dc:creator>\n' +
        '	<category><![CDATA[2. Ev\u00e8nements du Club]]></category>\n' +
        '</channel>\n' +
        ''
    },
    {
      title: 'translate.po',
      mime: 'text/gettext',
      content: 
        'msgid ""\n' +
        'msgstr ""\n' +
        '	"Language: en_US\\n"\n' +
        '	"MIME-Version: 1.0\\n"\n' +
        '	"Content-Type: text/plain; charset=UTF-8\\n"\n' +
        '	"Content-Transfer-Encoding: 8bit\\n"\n' +
        '\n' +
        '# comment\n' +
        'msgctxt "license"\n' +
        'msgid "License"\n' +
        'msgstr "License"\n' +
        '\n' +
        'msgctxt "5_days_left"\n' +
        'msgid "1 day"\n' +
        'msgid_plural "%d day\\"newbie\\""\n' +
        'msgstr[0] "1 day"\n' +
        'msgstr[1] "%d days"\n' +
        ''
    },
    {
      title: 'data.json',
      mime: 'application/json',
      content: 
        '{"abc":"13","xyz":{"field1":"value1"}}\n' +
        '{"abc":"13","xyz":{"field1":"value1"}}\n' +
        '{"abc":"13","xyz":{"field1":"value1"}}' +
        ''
    },
    {
      title: 'test.md',
      mime: 'text/markdown',
      content: 
        'testtext\n' +
        '[emptylink]()\n' +
        '\n'+
        '[yandex](http://yandex.ru)\n' +
        '\n' +
        '# ng Bookdddstay\n' +
        'Stay on page 167\n' +
        '\n' +
        'text1  \n' +
        'text2  \n' +
        'text3\n' +
        '\n' +
        '\n' +
        '\n' +
        '\ttext\n' +
        ' \n' +
        'sss \n' +
        '\n' +
        '\n' +
        '# Helee\n' +
        '## loff\n' +
        'edwedwed\n' +
        '## sub title3\n' +
        'abcdefgh\n' +  
        'abcdefgh\n' +  
        '### edwedwedwe\n' +
        '\n' +
        'Example of command `ss	`fwewfw`sdd`dd`wdedwe` `` `--wswsed-`\n' +
        '---\n' +
        '\n' +
        '#### 1233\n' +
        'Example  \n' +
        '\n' +
        '```html\n' +
        '<!DOCTYPE html>\n' +
        '<html>\n' +
        '	<head>\n' +
        '		<meta charset="utf-8"/>\n' +
        '	</head>\n' +
        '	<body>\n' +
        '		<h2>Hello world!</h2>\n' +
        '	</body>\n' +
        '</html>\n' +
        '```\n' +
        'd ddwd\n' +
        '``` python\n' +
        'Code listening:\n' +
        '```\n' +
        '\n' +
        '```\n' +
        'edewd\n' +
        '```\n' +
        '\n' +
        'Text\n' +
        '**edwe\n' +
        'dw**\n' +
        '- abc;\n' +
        '- xyz;\n' +
        '- qwerty;\n' +
        '- 123. \n' + // this cose troubles
        '\n\n' +
        '1.	aaa;\n' +
        '2.	bbb;\n' +
        '3.	bbb;\n' +
        '4.	bbb;\n' +
        '\n\n' +
        '- abc;\n' +
        '- xyz;\n' +
        '	-	 qqq;\n' +
        '- qwerty;\n' +
        '\n' +
        '*11*\n' +
        '**22**\n' +
        '***33***\n' +
        '****44****\n' +
        '\n' +
        'another test text\n' +
        ''				
    },
    {
      title: 'blocks.js',
      mime: 'application/javascript',
      content: 
        'while(false){\n' +
        '	1;\n' +
        '}\n' +
        '{if(true){\n' +
        '\t11;\n' +
        '}\n' +
        '(function(){\n' +
        '\t1;\n' +
        '}())\n' +
        '}\n'
    }
  ].map((config) => new DocumentModel(config)));
  return projectModel;
};

},"/app/source/defaultProject":function anonymous(module,require
) {
const ProjectModel = require('./ProjectModel');
const DocumentModel = require('./DocumentModel');


module.exports = function(){
  var projectModel = new ProjectModel({
      title: 'default',
      opened_ids: Array(4),
      current_doc: undefined,
      docs: {},
  });
  projectModel.add([
    {
      title: 'index.html',
      mime: 'text/html',
      content: 
        '<!DOCTYPE html>\n' +
        '<html>\n' +
        '	<head>\n' +
        '		<meta charset="utf-8">\n' +
        '		<link rel="stylesheet" type="text/css" href="./style.css"/>\n' +
        '	</head>\n' +
        '	<body>\n' +
        '		<h1>Hello world!</h1>\n' +
        '		<script src="./script.js"></script>\n' +
        '	</body>\n' +
        '</html>\n'
    },
    {
      title: 'style.css',
      mime: 'text/css',
      content: 
        'html{ font: 13px/18px Arial; }	\n' +
        'body{ margin: 0; }\n' +
        'button, input{ font-family: inherit; }\n' +
        'table{ border-collapse: collapse; }\n'
    },
    {
      title: 'script.js',
      mime: 'application/javascript',
      content: ''
    },
    {
      title: 'readme.txt',
      mime: 'text/plain',
      content: ''
    },
  ].map((settings) => new DocumentModel(settings)));
  return projectModel;
};

},"/app/source/reactProject":function anonymous(module,require
) {
const ProjectModel = require('./ProjectModel');
const DocumentModel = require('./DocumentModel');


module.exports = function(){
  var projectModel = new ProjectModel({
      title: 'react app',
      opened_ids: Array(4),
      current_doc: undefined,
      docs: {},
  });
  projectModel.add([
    {
      title: 'index.html',
      mime: 'text/html',
      content: 
`<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<link rel="stylesheet" type="text/css" href="./style.css"/>
	</head>
	<body>
        <div id="root"></div>
        <script src="https://unpkg.com/react@16.3.2/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@16.3.2/umd/react-dom.production.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js" charset="utf-8"></script>
        <script type="text/babel" src="./app.jsx">
        </script>
	</body>
</html>
`        
    },
    {
      title: 'style.css',
      mime: 'text/css',
      content: 
`html{ font: 13px/18px Arial; }
body{ margin: 0; }
button, input{ font-family: inherit; }
table{ border-collapse: collapse; }
`
        
    },
    {
      title: 'app.jsx',
      mime: 'application/javascript',
      content: 
`const App = (props) => <h1>Hello world!</h1>;

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
`
    },
  ].map((settings) => new DocumentModel(settings)));
  return projectModel;
};

},"/app/lib/BasePopupView":function anonymous(module,require
) {
const BacksideView = require('../../packages/backside/view');
const each = require('each.utils');
const $4 = require('../../packages/$4/index');

class BasePopupView extends BacksideView {
  /**
   * How to access popups at stack: ENV.$UI.BasePopupView.prototype.stack
   * @param {Object} conf
   * @param {HtmlElement} conf.heap - popups container, default #node-heap or document.body
   * @param {Function} conf.onopen
   * @param {Function} conf.onclose
   */
  constructor(conf) {
    super(conf);
  }
  
  initialize(conf) {
		if(conf.el){
			this.el = conf.el;
		}else{
			this.el = document.createElement(conf.tagName || 'dialog');
			this.el.className = this.className + (conf.className ? ' ' + conf.className : '');
		}

		this.children = {};
		this.render(conf);
		if (this.el.tagName.toLowerCase() !== 'dialog') {
			this.el.style.display = 'none';
		}
		this.el.setAttribute('tabindex', 0);
		this.$heap = conf.heap || document.getElementById('node-heap') || document.body;
		this.$heap.appendChild(this.el);

		this.onOpen = conf.onopen || function(){};
		this.onClose = conf.onclose || function(){};
		this.destroyOnClose = conf.destroyOnClose != undefined ? conf.destroyOnClose : true;
		if(conf.css) $4.css(this.controls.content, conf.css);
		if(conf.class) this.el.className += ' ' + conf.class;
		if(conf.model) this.model = conf.model; 
		this.destroyOnClose = conf.destroyOnClose;

		if(conf.moveable){
			this.controls.content.classList.add($UI._MOVEABLE_CLASS);
			this.dragEngine = new $UI.helpers.MouseMovingController(this.controls.content, this.controls.content.header);
		}

		setTimeout(function(){
			this.el.focus();
		}.bind(this), 0);

		this.on('click', function(){
			this.close();
		}.bind(this));
		this.on('keydown', function(e){
			if (e.keyCode == 27) this.close();
		}.bind(this));
		this.on('content', 'click', function(e){
			e.stopPropagation();
		}.bind(this));
	}
	
  render(conf) {
		this.controls = {};
		this.el.innerHTML = 
		'<div class="dwc_popup-wrap">' +
			'<div class="dwc_popup-content" data-co="content">' +
				'<div class="dwc_popup-header" data-co="header">' + (conf.title || '') + '</div>' +
				'<div class="dwc_popup-body clearfix" data-co="body">' + (conf.content || '') + '</div>' +
			'</div>' +
			'<div class="m3_middle_helper"></div>' +
		'</div>';
		this.bindByData(this.el);
		conf.popupEvents && this._bindEvents(conf.popupEvents);
	}
  
	remove(){
		this.dragEngine && this.dragEngine.destroy && this.dragEngine.destroy();
		
		each(this.children, function(view){
			view.remove();
		});
		this.off();
		this.el.remove;
		this.model && this.model.off();
		// Remove popup from stack
		var 	stackPos = this.stack.indexOf(this);
		
		if(stackPos != -1) this.stack.splice(stackPos, 1);

		return this;
	}
  
	open() {
		this.onOpen(this);
		document.documentElement.style.overflow = 'hidden';
		document.body.overflow = 'hidden';

		if (this.el.tagName.toLowerCase() === 'dialog') {
			console.log('Dialog');
			this.el.setAttribute('open', true);
		} else {
			this.el.style.display = '';	
		}
		this.stack.push(this);
	}
  
	// if onClose return true close would be canceled
	close(status) {
		this.onClose(this, status) || this._completeClose();
	}
  
	_completeClose(){
		if (this.el.tagName.toLowerCase() === 'dialog') {
			this.el.removeAttribute('open');
		} else {
			this.el.style.display = 'none';
		}
		
		document.documentElement.style.overflow = '';
		document.body.overflow = '';
		this.destroyOnClose && this.remove();
	}
  
	_bindEvents(events) {
		var 	pos, controlName, eventName;

		for (var key in events) {
			pos = key.indexOf(' ');
			
			if(pos != -1){
				eventName = key.substr(pos + 1);
				controlName = key.substr(0, pos);

				if(this.controls[controlName]){
					this.controls[controlName]['on' + eventName] = events[key].bind(this);
				}
			}
		}
	}
}

BasePopupView.prototype.className = 'dwc_popup';
BasePopupView.prototype.stack = []; // stack for opened popups

module.exports = BasePopupView;

},"/packages/viewcompiler/viewcompiler":function anonymous(module,require
) {
//==================================
// View compiler (v. 17) 2019-2020
//==================================
const $4 = require('../$4/index');
const Model = require('../backside/model');
module.exports = compile;

// TODO use another literals
const LIT = {
	$if: '*if',
	$equal: '*equal',
	$model: '*model',
	$alias: '*ref',
	$for: '*for',
	$each: '*each',
};

// CleaningNode and CleaningLeaf build a tree of cleaning
class CleaningNode {

	constructor (id) {
	  if (id) this.id = id;
	  this.subjects = [];
	  this.$target = null;
	}

	onDestroy(destructor) {
	  this._onDestroy = destructor;
	}

	destroy(destroySelf=true) {
	  let i_n = this.subjects.length;

	  while(i_n-- > 0) {
		  this.subjects[i_n].destroy();
	  }
	  this.subjects.length = 0;
	  if (destroySelf && this._onDestroy) {
		this._onDestroy(this);
	  }
	}
}

class CleaningLeaf {

    onDestroy(destructor) {
      this._onDestroy = destructor;
    }

    destroy() {
      if (this._onDestroy) {
        this._onDestroy(this);
      }
    }
}

class AttributeLeaf extends CleaningLeaf {

    /**
     * @param {AttributeNode} $attr
     * @param {Model} $model
     * @param {(string) => string} pipeCb
     */
    constructor ($attr, $model, pipeCb) {
      super();
      this.$target = $attr;
      this.$model = $model;
      this.pipeCb = pipeCb;
      // The list of attribute value's parts 
      this.aZones = [];
      // List of observed properties
      this.affectedProperties = [];
      this.onDestroy(function(self) {
        for (let i = 0; i < self.affectedProperties.length; i += 2) {
          self.$model.off(self.affectedProperties[i], self.affectedProperties[i + 1]);
        }
        self.affectedProperties.length = 0;
        self.aZones.length = 0;
      });
    }

    /**
     * @return {AttributeLeaf}
     */
    update(){
      const newAttrValue_s = this.aZones.map(function(item){
        if (typeof(item) === 'string') return item;

        return item();
      }).join('');
      this.$target.value = newAttrValue_s;
      return this;
    }

    /**
     * @param {boolean} isOpen
     * @param {string} textFragment
     * @return {void}
     */
    parseIterator(isOpen, textFragment) {
      if (!isOpen) this.aZones.push(textFragment);
	
      const propertyName = getModelPropertyName(textFragment);
      this.affectedProperties.push(
        propertyName, 
        this.$model.on('change:' + propertyName, () => {
          this.update();
        })
      );
      // ?? maybe warp into a class instance
      this.aZones.push(() => {
    		return this.pipeCb(textFragment); 
      });
    }
}

class EventLeaf {
  constructor (id, $node) {
    this.id = id;
    this.events = [];
    this.$target = $node;
  }

  destroy() {
    for(let i = 0; i < this.events.length; i += 2) {
      this.$target.removeEventListener(this.events[i], this.events[i+1]);
    }
    this.events.length = 0;
    this.$target = null;
  }
}


/**
* @param {string} pattern_s
* @param {Model} model
* @param {Object} pipesMap
* @return {string} value
*/
function pipeExecute(pattern_s, model, pipesMap){
    if (!pattern_s.includes('|') || !pipesMap) {
      return model.get(pattern_s) || '';
    }

    const pipes = pattern_s.replace(/\s+/g, '').split('|');
    let value  = model.get(pipes.shift()) || '';
    let i = 0;

    while (i < pipes.length) {
      if (pipesMap.hasOwnProperty(pipes[i])) {
        value = pipesMap[pipes[i]](value);
      }
      i++;
    }
    return (value).toString();
}

/**
* @param {string} pattern_s
* @return {string}
*/
function getModelPropertyName(pattern_s) {
    const pos = pattern_s.indexOf('|');

    if (pos < 0) return pattern_s;
    return pattern_s.substring(0, pos).trim();
}

/**
* @param {string} pattern
* @param {Model} model
* @param {Object} pipes
* @return {string}
*/
function oneTimeInterpolation(pattern, model, pipes) {
    return pattern.replace(
      /\[\[([^\[\]]*)\]\]/g,
      function(match, frag, pos, str) {
        return pipeExecute(frag, model, pipes);
      }
    );
}

/**
* @param {string} str
* @param {(boolean, string) => void} cb
* @return {void}
*/
function parseTemplate(str, cb) {
    let pos = 0;
    let start = pos;
    let isOpen = false;

    while (pos !== -1) {
      pos = str.indexOf(isOpen ? '}}' : '{{', start);
      if (pos < 0) continue;
      cb(isOpen, str.substring(start, pos));
      start = pos + 2;
      isOpen = !isOpen;
    }
    cb(isOpen, str.substring(start));
}

/**
* @param {HtmlElement} $node
* @param {Model} model
* @param {CleaningNode} scope
* @param {Object} pipes
* @return {void}
*/
function stringInterpolation($node, model, scope, pipes) {
    let $frag = document.createDocumentFragment();

    parseTemplate($node.data, function(isOpen, textFragment) {
      const propertyName = getModelPropertyName(textFragment);
      const $text = document.createTextNode(
        isOpen
        ? pipeExecute(textFragment, model, pipes)
        : textFragment
      );
      $frag.appendChild($text);

      if (isOpen) {
      // For each interpolated block {{***}} there will be an observer
      let watcher = new CleaningLeaf();
      watcher.$target = $text;
      watcher.property = textFragment;

      let handler = function(value, m_o) {
        watcher.$target.textContent = pipeExecute(textFragment, model, pipes);
      };
      model.on('change:' + propertyName, handler);
      watcher.onDestroy(function(self) {
        model.off('change:' + propertyName, handler);
      });
      scope.subjects.push(watcher);
      }
    });

    $node.replaceWith($frag);
}

/**
* @param {AttributeNode} $attr
* @param {Model} $model
* @param {Object} pipes
* @return {AttributeLeaf}
*/
function attributeInterpolation($attr, $model, pipes){
    const watcher = new AttributeLeaf($attr, $model, function(pattern_s){
      return pipeExecute(pattern_s, $model, pipes); 
    });

    parseTemplate($attr.value, watcher.parseIterator.bind(watcher));

    return watcher.update();
}

/**
* @param {HTMLCollection} $template - <template>
* @param {string} [childTagName_s] = 'div'
* @return {HTMLElement} $target
*/      
function cloneTemplate($template, childTagName_s = 'div', force=false) {
    // If <template> contains only one node the app should insert it directly
    const $cloneNode = document.importNode($template.content, true);
    let $temp;
    let $target;
    
    if ($cloneNode.children.length === 1 && !force) {
      $temp = $cloneNode;
      // Attention: next command must be executed before element will be inserted in DOM, because $temp is HtmlDocumentFragment 
      $target = $temp.children[0];
    } else {
      $target = $temp = $4.cr(childTagName_s);
      $temp.appendChild($cloneNode);
    }
    $4.appendAfter($template, $temp);
    return $target;
}

class LoopWatcher {
  
    constructor ($template, $model, pipes) {
      this.$template = $template;
      this.model = $model;
      this.pipes = pipes;
      this.subjects = []; // @todo store items
      this.$target = null;
      this._onDestroy = null;
    }

    onDestroy(destructor) {
       this._onDestroy = destructor;
    }
    
    static LIST_TAGS = 'OL,UL'.split(',') 

    render(item, modelAlias) {
      const parentNodeTagName = this.$template.parentNode.tagName;
      const $target = cloneTemplate(
        this.$template, 
        // When the internal content does not have any root element the compiler automatically wraps the nodes in these root nodes
        LoopWatcher.LIST_TAGS.includes(parentNodeTagName) ? 'li' : 'div',
        // If the content must be a list (wrapped with <UL> or <OL> tags)
        // and contain a single element that is not a <LI> tag, the content element will be wrapped with the <LI>tag
        this.$template.content.children.length === 1 && !LoopWatcher.LIST_TAGS.includes(this.$template.content.children[0].tagName)
      );
      let subScope = compile($target, new Model({[modelAlias]: item}), this.pipes);
      this.subjects.push(subScope);
    }

    cleanUp() {
      let i_n = this.subjects.length;
      while (i_n-- > 0) {
      	$4.removeNode(this.subjects[i_n].$target);
        this.subjects[i_n].destroy(true);
      }
      this.subjects.length = 0;
    }

    destroy(destroySelf=true) {
      this.cleanUp();
      if (destroySelf && this._onDestroy) {
      	this._onDestroy(this);
      }
    }

    mount($root) {
      this.$root = $root;
    }
}


// @property Array<function, function> - validator and activator
const directiveMap = [];

// #1 *if="" *equal=""
directiveMap.push(function($n){
    let ifAttr = $n.attributes[LIT.$if];
    let equalAttr = $n.attributes[LIT.$equal];
    return ifAttr && ifAttr.value &&
      equalAttr && equalAttr.value &&
      $n.tagName === 'TEMPLATE';
  }, function($n, $m, _pipes){
    let subScope = new CleaningNode('*if');
    let modelPropertyName_s = $n.attributes[LIT.$if].value;
    const referenceContent = $n.attributes[LIT.$equal].value;
    // The equality reference can be received from the model:
    let equalData;
    if ($m.has(referenceContent)) {
      equalData = $m.get(referenceContent);
    } else {
      try {
        equalData = JSON.parse(referenceContent);
      } catch(e) {
        equalData = null;
      }
    }

    let changeHandler = $m.on('change:' + modelPropertyName_s, function(value, m_o) {
      if (
        Array.isArray(equalData)
          ? equalData.indexOf(value) !== -1
          : equalData === value
      ) {
        // In case when the condition is true:
        // check whether the view has already been created
        if (!subScope.$target){
      	  subScope.$target = cloneTemplate($n);
          subScope.subjects.push(compile(subScope.$target, $m, _pipes));
        }
      } else if (subScope.$target){
        subScope.destroy(false);
        $4.removeNode(subScope.$target);
        subScope.$target = null;
      }
    });
    // Initialize execution
    $m.trigger('change:' + modelPropertyName_s, $m.get(modelPropertyName_s), $m); 
    // Creation of destructor
    subScope.onDestroy((_) => {
      $m.off('change:' + modelPropertyName_s, changeHandler);
    });

    return subScope;
});
// #2 *model=""
directiveMap.push(function($n){
    const modelAttr = $n.attributes[LIT.$model];
    const tagName = $n.tagName.toLowerCase();

    return modelAttr && modelAttr.value 
      && (tagName === 'input' || tagName === 'select')
  }, function($n, $m){
    let subScope = new CleaningNode('*model');
    let modelAttr = $n.attributes[LIT.$model].value;
    let inputHandler = (e) => {
      const $n = e.target;
      // Default for `text` type:
      let value = $n.value;

      // TODO add other types
      if ($n.tagName.toLowerCase() === 'input') {
        if (
          $n.type === 'number'
          || $n.type === 'range'
        ) {
            value = parseInt(value, 0);
        }

        if (
          $n.type === 'checkbox'
          || $n.type === 'radio'
        ) {
            value = e.target.checked;
        }

        if ($n.type === 'date') {
          value = $n.valueAsDate;
        }
      }

      $m.change(modelAttr, value);
    };

    if ($n.type === 'radio' || $n.type === 'checkbox' || $n.type === 'date') {
      // In case of <input>
      let changeHandler = $m.on('change:' + modelAttr, function(value, m_o) {
          //if (m_o.previous && m_o.previous[modelAttr] === value) return;
          $n.checked = value;
      });
      $n.addEventListener('change', inputHandler);
      subScope.onDestroy((_) => {
          $m.off('change:' + modelAttr, changeHandler);
          $n.removeEventListener('change', inputHandler);
      });
      // Initial set
      if ($m.get(modelAttr)){
         $n.checked = $m.get(modelAttr);
         // Force set
         $m.trigger('change:' + modelAttr, $m.get(modelAttr), $m);
         inputHandler({target: $n});
      }
    } else {
      let changeHandler = $m.on('change:' + modelAttr, function(value, m_o) { // for <input>
        $n.value = value;
      });
      $n.addEventListener('input', inputHandler);
      subScope.onDestroy((_) => {
        $m.off('change:' + modelAttr, changeHandler);
        $n.removeEventListener('input', inputHandler);
      });
      // Initial set
      if ($m.get(modelAttr)){
        const initValue = $m.get(modelAttr);
        $n.value = initValue;

        if ($n.tagName.toLowerCase() === 'input') {
          // Force set
          $m.trigger('change:' + modelAttr, initValue, $m);
          inputHandler({target: $n});
        } else if ($n.tagName.toLowerCase() === 'select'){
          // Fixing the case when options use interpolations
          setTimeout(function() {$n.value = initValue;}, 0);
        }
      }
    }

    return subScope;
});

// #3 *on-<EVENT NAME>="<HANDLER>"
directiveMap.push(function($n){
    let i_n = $n.attributes.length;
    while (i_n--> 0) if ($n.attributes[i_n].name.includes('*on-')) return true;
    return false;
}, function($n, $m){	
    const subScope = new EventLeaf('*on', $n);
    let i_n = $n.attributes.length;
    let attr;
    while (i_n--> 0) {
      attr = $n.attributes[i_n];
      if (!attr.name.includes('*on-')) continue;
      let DOMEventName_s = attr.name.substr(4);
      let ModelDispatcherName_s = attr.value;
      let DOMEventHandler_f = function(e){
        $m.trigger(ModelDispatcherName_s, e, $m);
      };
      $n.addEventListener(DOMEventName_s, DOMEventHandler_f);
      subScope.events.push(DOMEventName_s, DOMEventHandler_f);
    }
    return subScope;
});

// #4 *ref="<alias name>"
// Triggers 'init-ref:<reference name>' and 'destroy-ref:<refernce name>'
directiveMap.push(function($n){
    return $n.attributes[LIT.$alias] && $n.attributes[LIT.$alias].value;
}, function($n, $m, pipes){	
    let subScope = new CleaningNode('*alias');
    let alias_s =$n.attributes[LIT.$alias].value;

    $m.trigger('init-ref:' + alias_s, $n, $m);
    subScope.onDestroy((/*ws*/) => {
      $m.trigger('destroy-ref:' + alias_s, $n, $m);
    });

    return subScope;
});


// #3 *for="" *each=""
directiveMap.push(function($n){
  return $n.attributes[LIT.$for] && $n.attributes[LIT.$each]
      && $n.attributes[LIT.$for].value && $n.attributes[LIT.$each].value;
}, function($n, $m, pipes){
    const modelAttr = $n.attributes[LIT.$for].value; // list
    const alias = $n.attributes[LIT.$each].value;
    const loopWatcher = new LoopWatcher($n, $m, pipes);
    loopWatcher.mount($n.parentNode);

    // TODO watch list
    let modelChangeHandler = $m.on('change:' + modelAttr, function(items, m_o) {
      console.log('The list changed');
      console.dir(items);
      console.dir(loopWatcher);
      // TODO fix
      loopWatcher.cleanUp();
      items.forEach((item) => {
        loopWatcher.render(item, alias);
      });
    });
    loopWatcher.onDestroy((/*ws*/) => {
      // cleanup loopWatcher
      loopWatcher.cleanUp();
      $m.off('change:' + modelAttr, modelChangeHandler);
    });

    // modelChangeHandler($m.get(modelAttr), $m);
    let items = $m.get(modelAttr);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        loopWatcher.render(item, alias);
      });
    }

    return loopWatcher;
});

// @param {HTMLElement} $root
// @param {Model} _model
// @param {Object} _pipes: {[String]: (Any) => Any }
// @return {CleaningNode} scope
function compile($root, _model, _pipes) {
    const scope = new CleaningNode();
    scope.$target = $root;
    let $node;

    // The creation of the iterator for text nodes
    var nodeIterator = document.createNodeIterator(
      $root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if ( /\{\{[^\\{\}]*\}\}|\[\[[^\[\]]*\]\]/.test(node.data) ) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      },
      false
    );

    // The interpolation of text blocks
    while (($node = nodeIterator.nextNode())) {
      if ($node.data.includes('[[')) { // one time interpolation
        $node.textContent = oneTimeInterpolation($node.textContent, _model, _pipes);
      }
      if ($node.data.includes('{{')) {
        stringInterpolation($node, _model, scope, _pipes);
      }
    }

    var directiveIterator = document.createNodeIterator(
        $root,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );

    let $attr;

    while (($node = directiveIterator.nextNode())) {
      // Attribute interpolation must be done before directories
      for ($attr of $node.attributes) {
        if ($attr.value.includes('[[')) { // one time interpolation
          $attr.value = oneTimeInterpolation($attr.value, _model, _pipes);
        }

        if ($attr.value.includes('{{')) {
          scope.subjects.push(attributeInterpolation($attr, _model, _pipes));
        }
      }
      // Iterate through the directive list
      for(let i = 0; i < directiveMap.length; i+= 2) {
        if (!directiveMap[i]($node)) continue;
        scope.subjects.push(directiveMap[i + 1]($node, _model, _pipes));
      }
    }

    return scope;
};

},"/app/source/spaces":function anonymous(module,require
) {
module.exports = {
  SPACE1: 0x1,
  SPACE2: 0x2,
  SPACE3: 0x4,
  SPACE4: 0x8,
  HORIZONTAL: 0x10,
};

},"/app/source/EditView":function anonymous(module,require
) {
const HtmlEdit = require('HtmlEditor');
const ExtMimeMap = require('ExtMimeMap');
const BacksideView = require('../../packages/backside/view');
const $4 = require('../../packages/$4/index');

function numberFragment(n){
  var frag = document.createDocumentFragment();

  for(var i = 1, buf; i < n; i++){
    buf = document.createElement('div');
    buf.textContent = i;
    frag.appendChild(buf);
  }

  return frag;
}

function findCloseBracket(str, start){
  var 	pos = start,
        c = -1,
        i = start,
        len = str.length;

  for (; i < len; i++) {
    if (str.charAt(i) == '{') {
      c++;
    } else if (str.charAt(i) == '}') {
      c--;

      if (c === -1) {
        pos = i + 1;
        break;
      }
    }
  }

  return pos;
};

function findOpenBracket(str, end){
  var 	pos = 0,
        c = -1,
        i = end;

  while (i-- > 0) {
    if (str.charAt(i) == '{') {
      c++;

      if (c == -1) {
        pos = i;
        break;
      }
    } else if (str.charAt(i) == '}') {
      c--;
    }
  }

  return pos;
};

class EditView extends BacksideView {
  initialize(conf) {
		super.initialize(conf);
		this.parent = conf.parent;

		if(conf.numerateLines){
			this.model.on('change:linesCount', (count, model) => {
				var prevCount = model.previous.linesCount || 0;

				if(count > prevCount){ // Scroll down
					this.controls.edit.scrollTop += 24 /*18*/; // TODO calculate line height
					$4.emptyNode(this.controls.scale);
					this.controls.scale.appendChild(numberFragment(count + 2));
					this.controls.scale.scrollTop = this.controls.edit.scrollTop;
				}

				this.controls.edit.scrollLeft = 0;
			});
		}else{
			this.controls.scale.style.display = 'none';
		}

		this.htmlEdit = new HtmlEdit(
			this.controls.edit, 
			conf.highlight, 
			{
				onLinesCountUpdate: conf.numerateLines ? function(count){
					this.model.change('linesCount', count);
				}.bind(this) : function(){},
				onChange: function(code){
					this.model.change('content', code);
				}.bind(this)
			},
			this.model
		);
		
		if (
      this.model.get('mime') == ExtMimeMap.js 
      || this.model.get('mime') == ExtMimeMap.json
    ){
			this.htmlEdit._hooks.ALT_B = function(fragment){
				var 	out = fragment;

				try {
					out = JSON.stringify(JSON.parse(fragment), null, '\t');
				} catch(e) {
					out = fragment.replace(/\{|\;|\,/g, function(s){
						return s + '\n';
					}).replace(/\}/g, function(s){
						return '\n' + s;
					});
				}
				return out;
			}
  this.htmlEdit.el.onmousedown = function(e){
    var $target = e.target;

// TODO refactor code
    if($target.classList.contains('sh-js_brackets')){ // Hide block
      e.preventDefault();
      e.stopPropagation();

      let 	isOpen = $target.textContent == '{',
		content = this.model.get('content'),
		posData = this.htmlEdit.getSelection(),
		curPos = posData.end;
					let 	startPos,
		targetPos = this.htmlEdit.getElementPos($target),
		endPos,
		blockCode;

      if (isOpen) {
	      startPos = targetPos;
	      endPos = findCloseBracket(content, startPos);
	      startPos++;
	      endPos--;
      }else{
	      endPos = targetPos;
	      startPos = findOpenBracket(content, endPos + 1);
	      startPos++;
      }

      blockCode = content.substring(startPos, endPos); 
      this.model._hiddenLinePattern.lastIndex = 0;
      
      if (this.model._hiddenLinePattern.test(blockCode)) {
	      return ;
      } 

      content = content.substring(0, startPos) + '%b' + this.model.createCodeBlock(blockCode) + 'b%' + content.substring(endPos);

      if(curPos > startPos){
	      if(curPos <= endPos){ // Cursor in hidden block
		      curPos = startPos + 13;
	      }else{ // Cursor was after hidden block
		      curPos -= blockCode.length - 12; 
	      }
      } 

      posData.sel.removeAllRanges();
      this.htmlEdit.setText(content)
      posData.sel.addRange(this.htmlEdit.setCaretPos(curPos));

  }else if($target.classList.contains('sh-codeblock')){
      e.preventDefault();
      e.stopPropagation();
      let codeBlockId = $target.dataset.id;
      let blocks = this.model.get('blocks');

      let codeBlock = blocks[codeBlockId],
	  content = this.model.get('content'),
	  posData = this.htmlEdit.getSelection(),
	  curPos = posData.end,
	  codeBlockSpace = '%b' + codeBlockId + 'b%',
	  blockSpacePos = this.htmlEdit.getElementPos($target);
							

  content = content.replace(codeBlockSpace, codeBlock);
  blocks[codeBlockId] = null;
  delete blocks[codeBlockId];

  if(curPos > blockSpacePos){
	curPos += codeBlock.length - codeBlockSpace.length; 
  }

  posData.sel.removeAllRanges();
  this.htmlEdit.setText(content);
  posData.sel.addRange(this.htmlEdit.setCaretPos(curPos));
				}
			}.bind(this);
			// Need to restore blocks at copying blocks
			this.htmlEdit._hooks.oncopy = function(code){
				var upd = this.model.getSource(code);
				return upd;
			}.bind(this);

			this.htmlEdit._hooks.onpaste = function(text){
				if (text.length > 10000) {
					var 	repit = true,
                _model = this.model;

					while(repit){
						repit = false;
						text = text.replace(/(\{[^\{\}]+\})/ig, function(str, blockCode){
							repit = true;
							return '%b' + _model.createCodeBlock(blockCode) + 'b%';
						});	
					}
				}
				return text;
			}.bind(this);			
		}

		// Hook for decoding selection with encoded uncode characters
		this.htmlEdit._hooks.ALT_U = function(fragment){
			if(/\\u[a-h0-9]{4}/.test(fragment)){
				return fragment.replace(/\\u([a-h0-9]{4})/ig, function(sub, code){
					return String.fromCharCode(parseInt(code, 16));
				});	
			}else{
				return fragment;
			}
		};

		if(conf.highlight && conf.highlight.commOpen){
			let 	_O = conf.highlight.commOpen, // Aka "Open"
            _C = conf.highlight.commClose, // Aka "Close"
            _OE = '\\' + _O.split('').join('\\'), // Aka "Open Escaped"
            _CE = '\\' + _C.split('').join('\\'),
            _clear1,
            _clear2;

			if (!_C) { // Comment by line
				_clear1 = new RegExp('^' + _OE, 'g');
				_clear2 = new RegExp('\n' + _OE, 'g');
				this.htmlEdit._hooks.CTRL_SLASH = function(fragment){
					if(fragment.substring(0, _O.length) == _O){
						return {
							text: fragment.substring(_O.length).replace(_clear2, '\n'),
							offset: - _O.length // Save offset to shift cursor in single line comment
						};
					}else{
						return {
							text: _O + fragment.replace(/\n/g, '\n' + _O),
							offset: _O.length
						};
					}
				};	
			}else{ // Comment by block
				_clear2 = new RegExp(_CE + '$', 'g');
				this.htmlEdit._hooks.CTRL_SLASH = function(fragment){
					if(fragment.substring(0, _O.length) == _O){
						return {
							text: fragment.substring(_O.length).replace(_clear2, ''),
							offset: - _O.length // Save offset to shift cursor in single line comment
						};
					}else{
						return {
							text: _O + fragment + _C,
							offset: _O.length
						};
					}
				};
			}
		}

		this.model.listen({
			'change:focus': (isFocused/*, m*/) => {
				this.controls.header.parentNode.classList[isFocused ? 'add' : 'remove']('__active');
			},
			'change:title': (title/*, m*/) => {
				this.controls.header.textContent = title;
			},
			'close': () => {
				this.el.remove();
			},
			'destroy': (m) => {
				m.trigger('close', m, this);
				this._removeEventListeners();
				this.remove();
			},
			'updateContent': (m, newContent) => {
				this.htmlEdit.setText(newContent);
				this.htmlEdit.setCaretPos(0);				
			},
		});

		this._removeEventListeners = this._prebindEvents();
		this.controls.header.textContent = this.model.get('title');
	}
  
  remove() {
		this.htmlEdit.destroy();
		super.remove();
	}
	
  getSource() {
		console.log('CALL EditView::getSource ');
		return this.model.getSource();
	};
  
}

EditView.prototype.className = 'sc_editwrap grid_cell-inner';
EditView.prototype.template = 
	'<div class="sc_editwrap-numspace" data-co="scale">1</div>' +
	'<div class="sc_editwrap-workspace" data-co="wrap" tabindex="1">' +
		'<pre class="sc_edit-pre" contenteditable data-co="edit"></pre>' +
	'</div>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' +
	'</div>' +
	'';

EditView.prototype.events = {
  'onkeydown': function(e){
    if(e.ctrlKey || e.metaKey){
      switch (String.fromCharCode(e.which).toLowerCase()) {
        case 's':
          e.preventDefault();
          console.warn('ctrl-s');
          // TODO trigger hotkey event
          break;
        case 'f':
          e.preventDefault();
          console.warn('ctrl-f');
          break;
        case 'g':
          e.preventDefault();
          console.warn('ctrl-g');
          break;
      }
    } else if (e.altKey) {
      if (e.keyCode == 39) { // [Alt + Right]
        this.parent.bus.trigger('focus_next_doc', this);
      } else if (e.keyCode == 82) { // [ALT + R]
        this.model.trigger('reloadMainFrame');
      } /*else{
        console.log('ALT key');	
        console.dir(e);
      }*/
    }
  },
  // use onkeyup event to observe by cursor position (need to restore previous position while navigation between documents)
  'onkeyup': function(e){
    if (!(e.altKey && e.keyCode == 39)) {
      var posData = this.htmlEdit.getSelection();
      this._lastPos = posData.end;
    }
  },
  'onclick close': function(){
    this.model.trigger('close', this.model, this);
  },
  'onscroll edit': function(e){
    this.controls.scale.scrollTop = e.target.scrollTop;
  },
  'onfocus edit': function(){
    this.model.change('focus', true);
  },
  'onblur edit': function(){
    // Safary does not allow to call getSelection() at not focused element! So it will cause an exception
    // Turn off to fix bug:
    // Try to store cursor position
    // var posData = this.htmlEdit.getSelection();
    // this._lastPos = posData.end;

    this.model.change('focus', false);
  },
};

module.exports = EditView;

},"/app/source/MarkdownViewer":function anonymous(module,require
) {
const BacksideView = require('../../packages/backside/view');

class MarkdownViewer extends BacksideView {
  // @param {Backside.Model} appModel
  // @param {Backside.Model} docModel
  constructor(conf) {
    super(conf);
    this.appModel = conf.appModel;
  }
  
  initialize(conf) {
		super.initialize(conf);
		this.el.style.display = 'none';
		this._stopEventsListeners = this._prebindEvents();
		this.listen('closePresentation', function(m){
			this.appModel.closeSpace(m.getPresentationID());
			this.el.remove();
		});
		this.listen('destroy', function(m){
      // TODO clear
      this._stopEventsListeners();
      this.remove();
      console.log('\t[TRIG destroy presentation view] %s', m.get('id'));
		});
		this.listen('reloadMainFrame', function(m){
			this.refresh();
		});
		this.listen('change:title', function(title, m){
			this.controls.header.textContent = title;
		});
		this.controls.frame.onload = function(e){
			this.updateContent(e.target.contentDocument, this.model.getSource());
		}.bind(this);
	}
  
	refresh() { // send reference on application
		var 	source = this.model.getSource();

		this.controls.frame.contentWindow.location.reload();
		this.controls.header.textContent = this.model.get('title');
	}

	updateContent(doc, source) {
		doc.open()
		doc.write('<style>html{font:12px/16px Arial;color:#333;}body{margin:8px;}p{margin:0 0 8px 0;}pre{display:block;padding:8px;margin: 0 0 1em 0;background:#3a3c56;color:#fff;tab-size:4;}.markdown-code{padding:0 2px;background:#26a75a;color:#fff;}p{margin: 0 0 8px 0;}a{color:#1459dd;}ul{padding: 0 0 0 20px;}</style>');
		doc.write(marked(source));
		doc.close();
	}
}

MarkdownViewer.prototype.className = 'sc_frame-wrap';
MarkdownViewer.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
MarkdownViewer.prototype.events = {
  'onclick close': function(){
    this.model.trigger('closePresentation', this.model);
  },
  'onclick reload': function(){
    this.refresh();
  },
  'onload frame': function(e){
    this.controls.header.textContent = this.controls.frame.contentDocument.title
  },
  'onclick separate': function(e){ // create independent instance of page
    // TODO need new code
    // var 	urlOnDoc = URL.createObjectURL(new Blob([this.html], {type: 'text/html'}));
    // window.open(urlOnDoc, '_blank');
  },
};

module.exports = MarkdownViewer;

},"/app/source/JsConsole":function anonymous(module,require
) {
const BacksideView = require('../../packages/backside/view');

class JsConsole extends BacksideView {
	/**
	 * @param {Backside.Model} conf.appModel
	 * @param {Backside.Model} conf.docModel
	 */
	constructor(conf) {
		super(conf);
		this.appModel = conf.appModel;
	}

	initialize(conf) {
		super.initialize(conf);
		this.el.style.display = 'none';
		this._stopEventsListeners = this._prebindEvents();
		this.model.listen({
			'closePresentation': (m) => {
				this.appModel.closeSpace(m.getPresentationID());
				this.el.remove();
			},
			'destroy': (m) => {
				this._stopEventsListeners();
				this.remove();
			},
			'reloadMainFrame': (m) => {
				this.refresh();
			},
			'change:title': (title, m) => {
				this.controls.header.textContent = title;
			},
	    });

		this.controls.frame.onload = function(e){
			this.updateContent(e.target.contentDocument, this.model.getSource());
		}.bind(this);
		this.controls.frame.onerror = function(e){
			console.log('Frame error');
			console.dir(e);
		};
	}
	
  refresh() { // send reference on application
		var 	source = this.model.getSource();

		this.controls.frame.contentWindow.location.reload();
		this.controls.header.textContent = this.model.get('title');
	}
	
  updateContent(doc, source) {
		doc.open();
		doc.write('<html><head>');
		doc.write('<style>html{font:13px/15px Arial;color:#333;}body{margin:0;}p{margin:0 0 8px 0;}.object-container{padding:0 0 0 10px;background:#daf1cb;font-size:12px;line-height:12px;}.object-container p{margin:0 0 0 10px;}.message-error{background:#ffddcf;}</style>');
		doc.write('<script>' + this.injectCode + '</script>');
		doc.write('</head><body>');

		// TODO:
		// 	(new Function('alert(1')).toString()
		
		let func;
		let compilationError;
		try {
			func = new Function(source);
		} catch(e) {
			compilationError = e.toString();
		}

		if (compilationError) {
			doc.write('<script>console._reportError(`' + compilationError + '`)</script>');
			
		} 
		else {
			// The try block can catch ReferenceError
			doc.write('<script>try{(' + func + '())}catch(e){_console.dir(e);_console.log(e.toString());console._reportError(e.stack)}</script>');
		}
	
		doc.write('</body></html>');
		doc.close();
	}
}
JsConsole.prototype.className = 'sc_frame-wrap';
JsConsole.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
JsConsole.prototype.injectCode =
`;(function(E){
	const ESCAPE_MAP = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;'
		};
	const UNESCAPE_MAP = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#x27;': "'"
	};

	const _console = E.console;

	function escape(str){
		return (str && str.replace) ? str.replace(/[<>&"']/g, function(m){
			return ESCAPE_MAP[m];
		}) : '';
	};
	function unescape(str){
		return str.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;)/g, function(m){
			return UNESCAPE_MAP[m];
		});
	};
	
	
	E.abc = {
		load: async function(url_s) {
			return new Promise(function(res, rej){
					let $script = document.createElement('script');
					$script.setAttribute('src', url_s);
					$script.onload = function(){
						res();
					};
					$script.onerror = function(){
						rej();
					};
					
					if(document.readyState != 'complete') {
						document.onreadystatechange = function(){
							if(document.readyState == 'complete'){
								document.body.appendChild($script);
							}
						};
					} else {
						document.body.appendChild($script);
					}
			});
		}
	};
	E._console = _console;

	function object2string(o) {
		//_console.dir(o);
		let s = '<div class="object-container">';
		s += _object2string(o);
		s += '</div>';
		return s;
	}
	function _object2string(o) {
		if (typeof(o) === 'object' && o &&
			(o.constructor === Object || o.constructor === Map || o.constructor === Set || Array.isArray(o))
		) {
			//_console.dir(o);
			let s = '<b>{</b>';
			let descriptors = Object.getOwnPropertyDescriptors(o);
			let value;
			let property;
			
			for (property in descriptors) {
				value = descriptors[property].value;
				if (typeof(value) === 'object' && value.constructor === Object) {
					s += '<p>' + escape(property) + ':</p>';
					s += object2string(value);
				} else {
					s += '<p source="descr">' + escape(property) + ': ' + _object2string(value) + '</p>';
				}
			}
			
			
			if (o[Symbol.iterator] && !Array.isArray(o)){
				for (property of o[Symbol.iterator]()) 
					s += '<p source="iter">' + _object2string(property) + '</p>';
			}
			
			if (Object.getPrototypeOf(o)) {
				s += '<p>prototype: ' + Object.getPrototypeOf(Object.create(o)).constructor.name + '</p>';
			}
			
			s += '<b>}</b>';
			
			return s;
		} else {
			if (typeof(o) == 'string') return '"' + escape(o + '') + '"';
			return escape(o + ''); // "+" converts all types to string!
		}
	}

	
	
	E.console = {
		log: function(a0, ...args){
			var 	len = args.length;
			var 	s = a0 + '';

			_console.dir(s);
			_console.dir(args);
			
			
			if(len > 0){
				for(var i = 0; i < len; i++){
					s = s.replace('%s', args[i]);
				}
			}else{
				s += ''; // Converting to string
			}
			let $n = document.createElement('p');
			$n.innerHTML = escape(s).replace(/\\n/g, '<br/>&#8203;')
			document.body.appendChild($n);

		},
		dir: function(o){
			let $n = document.createElement('div');
			$n.className = 'object-container';
			$n.innerHTML = _object2string(o);
			document.body.appendChild($n);
		},
		clear: function(){
			document.body.innerHTML = '';
		},
		_reportError: function(message){
			let $n = document.createElement('p');
			$n.className = 'message-error';
			$n.innerHTML = escape(message).replace(/\\n/g, '<br/>&#8203;');
			document.body.appendChild($n);
		}
	};
	E.onerror = function(e, s, line, position, error){
		console._reportError(e.stack + ' ' + line + ':' + position);
		_console.log('Catch error');
		_console.dir(arguments);
	};
	E.addEventListener('unhandledrejection', function(e) {
		console._reportError(e.reason.stack + '');
		_console.log('Promise exception');
		_console.dir(e);
		_console.dir(e.reason +'');
	});
	
}(window));`;
JsConsole.prototype.events = {
  'onclick close': function(){
    this.model.trigger('closePresentation', this.model);
  },
  'onclick reload': function(){
    this.refresh();
  },
  'onload frame': function(e){
    this.controls.header.textContent = this.controls.frame.contentDocument.title
  },
  'onclick separate': function(e){ // create independent instance of page
    // TODO need new code
    
    // var 	urlOnDoc = URL.createObjectURL(new Blob([this.html], {type: 'text/html'}));
    // window.open(urlOnDoc, '_blank');
  },
};

module.exports = JsConsole;

},"/app/source/FrameView":function anonymous(module,require
) {
const BacksideView = require('../../packages/backside/view');

class FrameView extends BacksideView {
  // @param {Backside.Model} appModel
  // @param {Backside.Model} docModel
  constructor(conf) {
    super(conf);
    this.appModel = conf.appModel;
		// Inner resource cash
		this._url_resources = [];
		this._model_resources = [];
  }
  
  initialize(conf) {
		super.initialize(conf);
		this.el.style.display = 'none';
		this._removeEventListeners = this._prebindEvents();
		this.model.listen({
			'closePresentation': (m) => {
				this.clearSubResources();
				this.appModel.closeSpace(m.getPresentationID());
				this.el.remove();
			},
			'destroy': (/*m*/) => {
				this._removeEventListeners();
				this.clearSubResources();
				this.remove();
			},
			'reloadMainFrame': (/*m*/) => {
				this.refresh();
			},
			// This event handler would be flushed when parent view would be removed with all child views
			'change:title': (title/*, m*/) => {
				this.controls.header.textContent = title;
			},
		});
	}
  
  clearSubResources(){
		var 	i = this._url_resources.length;

		while(i-- > 0){
			if (this._model_resources[i]) {
				this._model_resources[i].off('reloadMainFrame');	
			} 
		}

		i = this._url_resources.length;
		while(i-- > 0){
			// revokeObjectURL() for clearing ObjectUrl instances (https://developer.mozilla.org/ru/docs/Web/API/URL/createObjectURL)
			URL.revokeObjectURL(this._url_resources[i]);
		}
		this._model_resources.length = 0;
		this._url_resources.length = 0;
	}
  
	refresh(){ // send reference on application
		this.clearSubResources();
		var 	source = this.model.getSource(),
					_app = this.appModel,
					_docs = _app.get('docs'),
					_self = this,
					blob,
					html;

		this.html = html = source.replace(/\"\.\/([^\"]+)\"/g, function(frag, fname){
			var 	sourceId = _app.docIDMap[fname],
						docModel = _docs[sourceId];
						
			if (!docModel) return sourceId; 

			// on "reload" call refresh
			docModel.on('reloadMainFrame', function(){
				_self.refresh();
			});

			let 	code = docModel.getSource(),
						blob = new Blob([code], {type: docModel.get('mime')}),
						url = URL.createObjectURL(blob);

			_self._model_resources.push(docModel);		
			_self._url_resources.push(url);
			
			return '\"' + url + '\"';
		});
		
		if (true) {
			let docUrl = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
			this.controls.frame.src = docUrl;
			this._url_resources.push(docUrl);
		} else { 
			// Old school method
			// Attention: if document need load external resources (<script src="http://">) there would be troubles after document reloading!
			var doc = this.controls.frame.contentWindow.document;
			doc.open();
			doc.write(html);
			doc.close();				
		}
		
		this.controls.header.textContent = this.model.get('title');
	}

} 
FrameView.prototype.className = 'sc_frame-wrap';
FrameView.prototype.template = 
'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
'<div class="sc_edit-header">' +
  '<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
  '<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
  '<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
  '<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
'</div>';

FrameView.prototype.events = {
  'onclick close': function(){
    this.model.trigger('closePresentation', this.model);
  },
  'onclick reload': function(){
    this.refresh();
  },
  'onload frame': function(e) {
    // Document may not contain a <title> tag
      
    if (
      !this.controls.frame.contentDocument
      || !this.controls.frame.contentDocument.title
      || this.controls.frame.contentDocument.title.length === 0
    ) return;
    this.controls.header.textContent = 'View: ' + this.controls.frame.contentDocument.title;
  },
  'onclick separate': function(e){
    // Create independent instance of page
    var 	_url = URL.createObjectURL(new Blob([this.html], {type: 'text/html'})),
          _window = window.open(_url, '_blank');
          _handler = function (e) {
            URL.revokeObjectURL(_url);
            _window.removeEventListener('beforeunload', _handler);
          };

    _window.addEventListener('beforeunload', _handler);
  },
}

module.exports = FrameView;

},"/app/source/SHighlighter":function anonymous(module,require
) {
function SHighlighter(conf){
  this.pattern = conf.PATTERN;
  this.transformer = conf.transformer.bind(conf);
  this.commOpen = conf.commOpen;
  this.commClose = conf.commClose;
}

SHighlighter.prototype.htmlspecialchars = function(str){
  return str ? str.replace(/[<>&]/g, function(m){
    return m == '<' ? '&lt;' : m == '>' ? '&gt;' : '&amp;';
  }) : '';
};

SHighlighter.prototype.prettify = function(str){
  return this
    .htmlspecialchars(str)
    .replace(this.pattern, this.transformer);
};
  
module.exports =  SHighlighter;

},"/app/source/HighlighterSets":function anonymous(module,require
) {
function span(className, textContent){
  return '<span class="' + className + '">' + textContent + '</span>';
}

module.exports = {
  js: {
    // todo test #private methods
    PATTERN: new RegExp(
      '' +
      '(\\%b\\d+b\\%)' + // @codeBlock
      '|' +
      '(//.*(?=[\\n]|$))|' + // a single line comment
      '(\\/\\*[\\s\\S]*?($|\\*\\/))|' + // a multiline comment
      // Attention: `.?` skips '\n' -> fixed by (*)
      '((?:\"[^\"\\\\]*(?:\\\\.?[^\"\\\\]*)*\")|(?:\'[^\'\\\\]*(?:\\\\.?[^\'\\\\]*)*\'))|' + // a single or double quote strings
      '(`[\\s\\S]+?`)|' + // multiline js strings
      '(' + // a regular expression literal 
        '(?:\\/[^\\s]+(?!\\\\)\\/)[img]{0,3}(?!\\d)(?=\\s*[\\;,\\x5d\\x29\\x2e\\n]?)' +
      ')|' +		
      '(function)(\\s*)([\\w\\d\\-\\_\\$]+)(\\s*\\()' + // a function name
      // Attention `constructor` is not a keyword
      '|(\\b(?:async|yield|await|try|catch|break|continue|do|in|else|for|if|return|while|with|switch|case|var|function|new|const|let|typeof|instanceof|throw|import|export|from|super|class|extends|static|this|delete|default)\\b)' + // @keywords
      '|(\\b(?:(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?)|(?:undefined|null|Infinity|NaN|true|false)\\b)|' + // a number 
      '(?:([@\\w\\$]+)(?=[(]))' + // function execution
      '|(\{|\})' // @figBrackets
      , 
    'g'),
    transformer: function(subStr, codeBlock, p1, p2, p2end, str1, str2, reg, funcDef, funcSplit, funcName, funcBrack, keywords, p6, method, figBrackets){
      if (codeBlock !== undefined) {
        // the DOM content must contain a code block identificator and be the same size as a corresponding model item
        return '<i class="sh-codeblock" data-id="' + codeBlock.substr(2, codeBlock.length - 4) + '"><span class="sh-codeblock_inner" contenteditable="false">' + codeBlock + '</span></i>';
      } else if (p1 !== undefined) {
        return span('sh_js_comment', subStr);
      } else if (p2 !== undefined) {
        return subStr.split('\n').map(function(str){return span('sh_js_comment sh_multiline', str);}).join('\n');
      } else if (str1 !== undefined || reg !== undefined) {
        let pos, prev = 0;
        
        while (pos !== -1){
          pos = subStr.indexOf('\n', prev);
          prev = pos + 1;
          if (subStr[pos - 1] !== '\\') {
            break;
          }
        }
        if (pos !== -1 ) {
          return span('sh_js_string', subStr.substring(0, pos)) + subStr.substring(pos);
        }
        return span('sh_js_string', subStr);
      } else if (str2 !== undefined) {
        return subStr.split('\n').map(function(str){return span('sh_js_string sh_multiline', str);}).join('\n');
      } else if (funcDef !== undefined) {	
        let s = span('sh_js_keyword', funcDef);

        if (funcSplit) {
          s += funcSplit;
        }
        if (funcName) {
          s += span('sh_js_func-name', funcName);
        }				
        if (funcBrack) {
          s += funcBrack; 
        }
        return s;
      } else if (keywords !== undefined) {
        return span('sh_js_keyword', subStr);
      } else if (p6 !== undefined) {
        return span('sh_js_number', subStr);
      } else if (method !== undefined){
        return span('sh_js_method', method);
      } else if (figBrackets !== undefined){
        return span('sh-js_brackets', figBrackets);
      }
    },
    commOpen: '//',
    commClose: ''
  },
  html: {
    ATTR: /([\w\d\-\:_]+)(?:(\s*=\s*)(\"[^\"]*\"|\'[^\']*\'|[^&\s]*))?/g,
    PATTERN: new RegExp(
      "(&lt;\\!\\[CDATA\\[[\\s\\S]*?\\]\\]&gt;)|(&lt;[!?][^&]+&gt;|&lt;\\!--[\\s\\S]+?--&gt;)|(&lt;/?[\\w\\-_:]*)" + // <![CDATA[<p>]]>, Comments(<!...>, <?...>) and tag name (<abc:x_y-z>)
      "((?:\\s+[\\w\\-:_]+(?:\\s*=\\s*(?:\"[\\s\\S]*?\"|'[\\s\\S]*?'|[^&\\s]*))?)*\\s*)" + // Attrribute
      "((?:/)?&gt;)?", 
    'g'),
    transformer:  function(subStr, cdata, comment, p1, p2, p3, p4, p5, p6){
      if (cdata) {
        return cdata.split('\n').map(function(str){return span('sh_html_cdata', str);}).join('\n');
      } 
      if (comment) {
        // @todo check if html comment can starts with multiline
        return '<span class="sh_html_comment">' + comment.replace(/\n/g, '</span>\n<span class="sh_html_comment sh_multiline">') + '</span>';
      }
      if (p1){
        let hstr = span('sh_html_tag', p1);
        
        if (p2) {
          let attr = p2.replace(this.ATTR, function(subStr, attr, sep, val){
            let res = '';

            if (attr) {
              res += span('sh_html_attr-name', attr);
            }
            if (sep) {
              res += sep;
            }
            if (val) {
              res += val.split('\n').map(function(str){return span('sh_html_attr-value', str);}).join('\n');
            }
            return res;
          });

          hstr += span('sh_html_attr-line', attr);
        }
        if (p3) {
          hstr += span('sh_html_tag', p3);
        }
        return hstr;
      }
    },
    commOpen: '<!--',
    commClose: '-->'
  },
  css: {
    PATTERN: new RegExp(
      '(\\/\\*[\\w\\W]*?\\*\\/)|([a-z\\-_]+)(?=\\s*\\:)|(\\#[abcdef0-9]{3,6})|([\\#\\.][_\\-a-z][\\w\\d\\-_]*)(?=\\s*[~>\\[\\{\\,\\+\\:]?)|(\\:{1,2}[\\a-z\\-_]+)(?=\\s|\\>|\\~|\\+|\\,|\\{)|(\"[^\"]*\"|\'[^\']*\')' +
      '|([\\w\\-\\_]+\\(|\\))',
      'ig'),
    transformer: function(subStr, comment, propertyName, hexColor, classSelector, pseudoclass, string, funcName, funcArg){
      if (comment) {
        return comment.split('\n').map(function(str){return span('sh_css_comment sh_multiline', str);}).join('\n');
      }
      if (classSelector) {
        return span('sh_css_class-selector', subStr);
      } else if (propertyName !== undefined) {
        return span('sh_css_property', subStr);
      } else if (hexColor !== undefined) {
        return '<span class="sh_css_hex-color">'  + '<i class="sh_css_color-mark" style="background:' + subStr + '"></i>' + subStr + '</span>';
      } else if (pseudoclass !== undefined) {
        return span('sh_css_pseudo', subStr);
      } else if (string !== undefined) {
        return span('sh_css_string', subStr);
      } else if (funcName != undefined) {
        return span('sh_css_func', funcName);
      }
    },
    commOpen: '/*',
    commClose: '*/'
  },
  gettext_po: {
    PATTERN: /(\#.*)|("[^"\\]*(?:\\.?[^"\\]*)*")|(\[\d*\])|(\b(?:msgctxt|msgid|msgid_plural|msgstr)\b)/ig,
    transformer: function(substr, comm, str, num, keyword){
      if (comm) {
        return span('sh_po_comment', comm);
      } else if (str) {
        return span('sh_po_string', str);
      } else if(num) {
        return span('sh_po_number', num);
      } else if (keyword) {
        return span('sh_po_keyword', keyword);
      }
    },
    commOpen: '#',
    commClose: ''
  },
  // ***\n - horizontal line (<hr/>) \n****\n
  markdown: {
    PATTERN: /\[([^\]]*)\]\(([^\)]*)\)|(\#+\s+)(.+)\n|```(.+)?\n([\s\S]*?)```|`(.*?)`|(\*+)([^*\n]+)(\*+)/ig, 
    transformer: function($sub_s, hyp_text, hyp_link, title_type, title_text, code_type, code, code_line, multiline_text_open, multiline_text, multiline_text_close, $pos){
      if (hyp_text != null) {
        return span('sh_markdown_hyptext', '[' + hyp_text + ']') + span('sh_markdown_hyplink', '(' + (hyp_link || '') + ')');
      } else if (title_type) {
        title_type = title_type.trim();
        return span('sh_markdown_title sh_markdown_titlesize' + title_type.length, title_type + '&nbsp;' + (title_text || '')) + '\n';
      } else if (typeof(code_line) == 'string'){ // fix empty string
        return '<i class="sh_markdown_code">`' + code_line + '`</i>';
      } else if (code != null){
        return '<pre class="sh_markdown_multiline-code">```' + 
          (code_type ? 
            span('sh_markdown_code-type', code_type) 
            : ''
          ) + 
          '\n' + code + '```</pre>';
      } else if (multiline_text) {
        let minLength_n = Math.min(multiline_text_open.length, multiline_text_close.length);
        let em_n = minLength_n % 2,
          strong_n = minLength_n >> 1,
          start_s = '*'.repeat(multiline_text_open.lengh - minLength_n) + '<em>'.repeat(em_n) + '<strong>'.repeat(strong_n),
          end_s = '</strong>'.repeat(strong_n) + '</em>'.repeat(em_n) + '*'.repeat(multiline_text_close.lengh - minLength_n);

          return start_s + multiline_text_open + multiline_text + multiline_text_close + end_s;
      } else {
        return $sub_s;
      }
    },
  }
};

},"/app/lib/downloadFile":function anonymous(module,require
) {
function downloadFileFromText(filename, content) {
  var 	a = document.createElement('a'),
      blob = new Blob([content], {type : "text/plain;charset=UTF-8"});

  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  delete a;
}
module.exports = downloadFileFromText;

},"/app/lib/ctxMenu":function anonymous(module,require
) {
const Cr = require('cr');

/**
 * @param {Object} conf
 * @param {HtmlElement} conf.target
 * @param {Function} conf.onclick
 */
function CtxMenu(conf, items){
  this.target = conf.target;
  var _co = {};

  this.target.appendChild(
    Cr('div', 'sc_ctx')
      .alias('menu', _co)
      .add(Cr.list(items, function(item) {
        return Cr('div', 'sc_ctx-item', item.label).data('role', item.role);
      }))
      .root
  );

  _co.menu.style.top = conf.target.clientHeight + 'px';

  conf.target.onmouseout = function(e){
    var 	$target = e.toElement || e.relatedTarget;

    if(!(
      $target === conf.target || conf.target.contains($target)
    )){
      conf.target.onmouseout = conf.target.onclick = null;
      _co.menu.remove();
    }
  }
  conf.target.onclick = function(e){
    e.stopPropagation();
    conf.target.onmouseout = conf.target.onclick = null;
    if(conf.onclick) conf.onclick(e.target.dataset.role);	
    _co.menu.remove();
  }
};

/**
 * @param {HtmlElement} conf.label
 * @param {HtmlElement} conf.menu
 * @param {String} conf.active_cls - activity mark
 */
function CtxMenu2(conf){
  // Open or hide menu
  conf.label.onclick = function(){
    var $list = conf.menu;

    if ($list.style.display == 'none') { // is hidden
      $list.style.display = '';
      conf.label.classList.add(conf.active_cls);
    } else {
      $list.style.display = 'none';
      conf.label.classList.remove(conf.active_cls);
    }
  };
  // Hide menu list (1)
  conf.menu.onmouseout = function(e){
    var 	$target = e.toElement || e.relatedTarget,
          $label = conf.label;

    if(!(
      $target === $label || $label.contains($target)
    )){
      conf.menu.style.display = 'none';
      conf.label.classList.remove(conf.active_cls);	
    }
  };
  // Hide menu list (1)
  conf.label.onmouseout = function(e){
    var 	$target = e.toElement || e.relatedTarget,
          $list = conf.menu,
          $label = conf.label;

    if(
      !$label.contains($target) && !$list.style.display
    ){
      $list.style.display = 'none';	
      $label.classList.remove(conf.active_cls);
    }
  };
};

module.exports = {
  CtxMenu,
  CtxMenu2
};

},"/app/source/about.popup":function anonymous(module,require
) {
const VOC = require('vocabulary');
const PopupBuilder = require('../lib/PopupBuilder');

module.exports = function(title_s, App){
  return new PopupBuilder({
			title: title_s,
			className: 'dwc_popup ppp_base',
			content: 
				'<form data-co="form" class="about-popup">' +
					'<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Features</h3>' +
						'<p class="sc_article1">ABC is a syntax-highlighting code editor:</p>' +
						'<ul class="sc_ul1">' +
							'<li>Javascript</li>' +
							'<li>HTML/XML</li>' +
							'<li>CSS</li>' +
							'<li>Gettext po</li>' +
              '<li>Markdown</li>' +
						'</ul>' +
						'<p class="sc_article1">Supports direct execution of JavaScript code and HTML pages in a browser.</p>' +
						'<p class="sc_article1">It works offline and allows you to develop a project as in a desktop IDE.</p>' +
					'</div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Supported keyboard shortcuts</h3>' +
						'<div data-co="toggle-btn" class="sc_virtual-link __default">' + VOC.show + '</div>' +
						'<div data-co="toggle-list" class="about-popup_hidden-content" style="display: none;">' +
							'<p class="sc_article1">Indents:</p>' + 
							'<ul class="sc_ul2">' +
								'<li><b>[Tab] + &lt;selection&gt;</b> - insertion of an indent at the begin of the line</li>' +
								'<li><b>[Tab + Shift] + &lt;selection&gt;</b> - remove indentation at the beginning of a line</li>' +
							'</ul>' +
							'<p class="sc_article1">Duplications:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[Ctrl + Shift + D]</b> - duplicate the current row</li>' +
								'<li><b>[Ctrl + Shift + D] + &lt;selection&gt;</b> - to create a duplicate of the selected text</li>' +
							'</ul>' +
							'<p class="sc_article1">Code commenting:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[Ctrl + /]</b> - comment the selected code snippet</li>' + //
							'</ul>' +
							'<p class="sc_article1">Code modifications:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[ALT + G]</b> - to convert a string to uppercase</li>' +
								'<li><b>[ALT + G] + &lt;selection&gt;</b> - to convert a selected code snippet to uppercase</li>' +
								'<li><b>[ALT + L]</b> - to convert a string to lowercase</li>' +
								'<li><b>[ALT + L] + &lt;selection&gt;</b> - to convert a selected code snippet to lowercase</li>' +
								'<li><b>[ALT + B]</b> - to beautifier code (implemented only for JS/JSON documents)</li>' +
								'<li><b>[ALT + B] + &lt;selection&gt;</b> - to beautifier seected code snippet (implemented only for JS/JSON documents)</li>' +
							'</ul>' +
							'<p class="sc_article1">Navigation between documents:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[Alt + Right]</b> - to focus the next open document</li>' +
								'<li><b>[Alt + R]</b> - to reload the current code in a linked code execution frame. For example, if you update the script, the parent view of the document will be reloaded.</li>' +
							'</ul>' +
						'</div>' +
					'</div>' +
					'<div class="dwc_btn-group">' +
						'<button class="dwc_btn" type="submit" data-co="submit-btn">' + VOC.close + '</button>' +
						'<button class="dwc_btn" data-co="start-test-prj-btn">' + VOC.start_test_prj + '</button>' +
						'<button class="dwc_btn __predefined" data-co="start-default-prj-btn">' + VOC.start_default_prj + '</button>' +
						'<button class="dwc_btn __predefined" data-co="start-react-prj-btn">' + VOC.start_react_prj + '</button>' +
					'</div>' +
				'</form>',
			events: {
				'form submit': function(e){
					e.preventDefault();
					this.close();
				},
				'close click': function(e){
					e.stopPropagation();
					this.close();
				},
				'startTestPrjBtn click': function(e){
					e.stopPropagation();
					this.close();
					if (App.model) App.model.destroy(); // Trigger destroy event

					App.initProject(require('./testProject')());
				},
				'startDefaultPrjBtn click': function(e){
					e.stopPropagation();
					this.close();
					if (App.model) App.model.destroy(); // Trigger destroy event

					const newProject = require('./defaultProject')();
					App.initProject(newProject);
				},
				'startReactPrjBtn click': function(e){
					e.stopPropagation();
					this.close();
					if (App.model) App.model.destroy(); // Trigger destroy event

					const newProject = require('./reactProject')();
					App.initProject(newProject);
				},

				'toggleBtn click': function(e){
					e.preventDefault();
					var $list = this.controls.toggleList;

					if ($list.style.display == 'none') { // show
						$list.style.display = '';
						e.target.textContent =  VOC.hide;
					} else {
						$list.style.display = 'none';
						e.target.textContent =  VOC.show;
					}
				}
			}
		});
}

},"/app/source/renameDocument.popup":function anonymous(module,require
) {
const VOC = require('vocabulary');
const PopupBuilder = require('../lib/PopupBuilder');

module.exports = function(title_s, doc){
  return new PopupBuilder({
    title: title_s,
    className: 'dwc_popup ppp_base',
    content: 
      '<form data-co="form" class="">' +
        '<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
        '<div class="sc_section4">' +
          '<label class="input-frame">' +
            '<input class="input-frame_input" type="text" required data-co="new-fname"/>' +
            '<span class="input-frame_placeholder">' + VOC.popupRenameDoc_fnamePlaceholder+ '</span>' +
          '</label>' +
        '</div>' +
        '<div class="dwc_btn-group">' +
          '<button class="dwc_btn __predefined" type="submit" data-co="submit-btn">' + VOC.btn_apply + '</button>' +
          '<button class="dwc_btn" type="reset">' + VOC.btn_cancel + '</button>' +
        '</div>' +
      '</form>',
    css: {
      width: '480px',
    },
    events: {
      'form submit': function(e){
        e.preventDefault();
        this.close(true);
      },
      'close click': function(e){
        e.stopPropagation();
        this.close();
      },
      'form reset': function(e){
        e.stopPropagation();
        this.close();
      },
      'newFname input': function(e){
        e.target.classList[e.target.value ? 'add' : 'remove' ]('__not-empty');
      },
    }
  }, {
    onopen: function(){},
    onclose: function(popup, submitted){
      if (!submitted) return;
      let newFname = this.controls.newFname.value;
      doc.change('title', newFname);
    }
  });
};

},"/app/source/createDocument.popup":function anonymous(module,require
) {
const VOC = require('vocabulary');
const BasePopupView = require('../lib/BasePopupView');
const DocumentModel = require('DocumentModel');
const ExtMimeMap = require('ExtMimeMap');

module.exports = function(_model, _view){
  return new BasePopupView({
    title: VOC.create_new_document,
    className: 'ppp_base',
    content: 
    '<form data-co="form" class="sc_crdoc-popup">' +
      '<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
      '<table class="sc_grid-type-a">' +
        '<tr>' +
          '<td>' + VOC.file_name + '</td>' +
          '<td>' +
            '<input class="sc_input" type="text" data-co="fname" required/>' +
          '</td>' +
        '</tr>' +
        '<tr>' + 
          '<td>' + VOC.highlighting_type + '</td>' +
          '<td>' +
            '<select class="sc_input" data-co="type">' +
              '<option value="txt">' + VOC.none_syntax_type + '</option>' +
              '<option value="html">HTML</option>' +
              '<option value="xml">XML</option>' +
              '<option value="svg">SVG</option>' +
              '<option value="css">CSS</option>' +
              '<option value="js">JS</option>' +
              '<option value="json">JSON</option>' +
              '<option value="po">PO (gettext)</option>' +
              '<option value="md">MARKDOWN</option>' +
            '</select>' +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<td>&nbsp;</td>' +
          '<td>' +
            '<label><input type="file" data-co="import-from-file" class="sc_invisible"/><span class="sc_virtual-link __default">' + VOC.import_from_file + '</span></label>' +
          '</td>' +
        '</tr>' +
      '</table>' +
      '<button class="dwc_btn" type="submit" data-co="submit-btn">' + VOC.create + '</button>' +
    '</form>',
    onopen: function(view){
      view._content = '';
      setTimeout(function(){
        this.controls.fname.focus();
      }.bind(this), 60);
    },
    onclose: function(view){
      view._content = null;
    },
    popupEvents: {
      'form submit': function(e){
        e.preventDefault();
        this.close();
        _model._add(new DocumentModel({
          id: _model.get('docs').length,
          title: this.controls.fname.value,
          mime: ExtMimeMap[this.controls.type.value] || 'text/plain',
          content: this.content,
        }));
      },
      'close click': function(e){
        e.stopPropagation();
        this.close();
      },
      'fname input': function(e){
        var 	val = e.target.value,
              dotPos = val.lastIndexOf('.'),
              ext = dotPos != -1 && val.substr(dotPos + 1).toLowerCase();

        this.controls.type.value =  ExtMimeMap.hasOwnProperty(ext) ? ext : 'txt';
      },
      'importFromFile change': function(e){
        var 	file = e.target.files[0],
              type = 'text/plain';

        switch(file.type){
          case 'image/svg+xml': type = 'svg'; break;
          case 'text/xml': type = 'xml'; break;
          case 'text/html': type ='html'; break;
          case 'text/css': type ='css'; break;
          case 'application/javascript': type ='js'; break;
          default: 
            if(/\.json/i.test(file.name)) type = 'json';
            break;
        }

        this.controls.type.value = type;
        this.controls.fname.value = file.name;
        
        if (!file) return;
        var fr = new FileReader();

        // Lock form while file is reading
        this.controls.submitBtn.disabled = true;

        fr.onload = function(e){      
          this.controls.submitBtn.disabled = false;
          this.content = e.target.result;
        }.bind(this);
        fr.onerror = function(e){
          console.warn('File reader error');
          console.dir(e);
        };
        fr.readAsText(file);
        e.target.value = ''; // reset input
      },
    },
  });
};

},"/app/source/settings.popup":function anonymous(module,require
) {
const VOC = require('vocabulary');
const PopupBuilder = require('../lib/PopupBuilder');
const compile = require('../../packages/viewcompiler/viewcompiler');
const { SPACE1, SPACE2, SPACE3, SPACE4, HORIZONTAL } = require('spaces');


module.exports = function(_self){
  return new PopupBuilder(
  {
    className: 'dwc_popup ppp_base',
    content: 
      '<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +

      '<h3 class="sc_header2">' + VOC.settingDialog_header_contentSettings +'</h3>' +
      
      '<label class="control-list-item sc_article1">' +
        '<span class="control-list-item_label">' + VOC.settingDialog_label_replaceTabBySpace + '</span>' +	
        '<input class="control-list-item_control" type="checkbox"/>' +
      '</label>' +
      
      '<div class="control-list-item sc_article1">' +
        '<span class="control-list-item_label">' + VOC.settingDialog_label_tabSize + '</span>' +
        '<input class="sc_input control-list-item_control" type="number" min="1" max="8" />' + 
      '</div>' +
      '<div class="control-list-item sc_article1">' +
        '<span class="sc_toppanel_text">' + VOC.settingDialog_label_grid + '</span>' +
        '<select data-co="select-grid" class="control-list-item_control sc_project-select">' +
          '<option value="7" selected>&#9608;</option>' +
          '<option value="6">&#9473;</option>' +
          '<option value="5">&#9475;</option>' +
          '<option value="4">&#9547;</option>' +
          '<option value="0">&#9507;</option>' +
          '<option value="1">&#9515;</option>' +
          '<option value="2">&#9531;</option>' +
          '<option value="3">&#9523;</option>' +
        '</select>' +
          // WATCHER! depends on select-grid 
          '<div>'+
            `<template *if="gridScheme" *equal="[7,11,15,23,27,19,3]">
              <label> Horizontal proportion: <input
                *model="hp1"
                type="number" min="-3" max="3" step="1" value="0"
              /></label>
            </template>
            <template *if="gridScheme" *equal="[7,11,15,23,27]">
              <label> Vertical proportion: <input
                *model="vp1"
                type="number" min="-3" max="3" step="1" value="0"
              /></label>
            </template>` +
          '</div>' +
      '</div>' +
      '<div class="control-list-item sc_article1">' +
        '<span class="sc_toppanel_text">' + VOC.settingDialog_label_theme + '</span>' +
        '<select data-co="select-theme" class="control-list-item_control sc_project-select">' +
          '<option value="light">Default</option>' +
          '<option value="theme-b">Light A</option>' +
          '<option value="dark">Dark A</option>' +
          '<option value="theme-a">Dark B</option>' +
          '<option value="theme-c">Dark C</option>' +
          '<option value="theme-d">Dark D</option>' +
          '<option value="theme-e">Dark E</option>' +
        '</select>' +
      '</div>' +
    '',
    events: {
      'close click': function(e){
        e.stopPropagation();
        this.close();
      },
      'selectGrid change': function(e){
        this.model.change('gridId', e.target.value);
        this.changeGrid(e.target.value);
      },
      'selectTheme change': function(e) {
        var theme = 'light';
        switch(e.target.value){
          case 'dark': theme = 'dark'; break;
          case 'theme-a': theme = 'theme-a'; break;
          case 'theme-b': theme = 'theme-b'; break;
          case 'theme-c': theme = 'theme-c'; break;
          case 'theme-d': theme = 'theme-d'; break;
          case 'theme-e': theme = 'theme-e'; break;
        }
        this.model.change('themeId', theme);
      },
    }
  }, {
    model: _self.stateModel,
    onopen: function(){
      this.controls.selectGrid.value = this.model.get('gridId') || '7';
      this.controls.selectTheme.value = this.model.get('themeId') || 'light';
                                    
      this._unbind = this.model.listen({
        'change:gridScheme': (gridScheme_n, m_o) => {
          if (gridScheme_n == 1 || gridScheme_n == 19) m_o.change('vp1', 0);
          if (gridScheme_n == 1 || gridScheme_n == 3) m_o.change('hp1', 0);
          console.log('SP gs: %s', gridScheme_n);
        },
      }, true);                              
      this.scope = compile(this.controls.body, this.model);
    },
    onclose: function(){
      this.scope.destroy();
      this._unbind();
      _self.$saveInitState(this.model.attr);
    },
    // changeGrid() converts gridId to change:gridScheme  
    changeGrid: function(gridId){
      var code = 0;

      switch(gridId){ 
        case '0': 
          code |= SPACE1;
          code |= SPACE2;
          code |= SPACE4;
          break;
        case '1': 
          code |= SPACE1;
          code |= SPACE2;
          code |= SPACE3;
          break;
        case '2': 
          code |= HORIZONTAL;
          code |= SPACE1;
          code |= SPACE2;
          code |= SPACE3;
          break;
        case '3': 
          code |= HORIZONTAL;
          code |= SPACE1;
          code |= SPACE2;
          code |= SPACE4;
          break;
        case '4': 
          code |= SPACE1;
          code |= SPACE2;
          code |= SPACE3;
          code |= SPACE4;
          break;
        case '5': 
          code |= SPACE1;
          code |= SPACE2;
          break;
        case '6': 
          code |= HORIZONTAL;
          code |= SPACE1;
          code |= SPACE2;
          break;
        case '7': 
          code |= SPACE1;
          break;
      }
  
      this.model.change('gridScheme', code);
    },
  });
};

},"/app/source/MainView":function anonymous(module,require
) {
const DocumentModel = require('DocumentModel');
const EditView = require('EditView');
const MarkdownViewer = require('MarkdownViewer');
const JsConsole = require('JsConsole');
const FrameView = require('FrameView');
const ExtMimeMap = require('ExtMimeMap');
const ProjectModel = require('ProjectModel');
const BasePopupView = require('../lib/BasePopupView');
const PopupBuilder = require('../lib/PopupBuilder');
const SHighlighter = require('SHighlighter');
const HighlighterSets = require('HighlighterSets');
const Configs = require('Configs');
const BacksideView = require('../../packages/backside/view'); 
const BacksideModel = require('../../packages/backside/model'); 
const BacksideEvents = require('../../packages/backside/events'); 
const BacksideUtils = require('../../packages/backside/utils'); 
const $4 = require('../../packages/$4/index');
const VOC = require('vocabulary');
const downloadFileFromText = require('../lib/downloadFile');
const {CtxMenu, CtxMenu2} = require('../lib/ctxMenu');
const createAboutPopup = require('about.popup');
const createRenameDocPopup = require('renameDocument.popup');
const createDocumentPopup = require('createDocument.popup');
const createSettingsPopup = require('settings.popup');

const LOCALSTORAGE_AVAILABLE = Configs.LOCALSTORAGE_AVAILABLE;

// Code editor with syntax highlighting v201 2019/12/01
// (C) 2015-2020
const VER = 211;

const {
  SPACE1, SPACE2, SPACE3, SPACE4, HORIZONTAL,      
} = require('spaces');

//==========================================
// MainView
//==========================================
class MainView extends BacksideView {

  constructor(conf, $getInitState, $saveInitState) {
    super(conf);
    this.subView = Object.create(null);
    this.bus = new BacksideEvents();
    this.listItems = {};
    this.$getInitState = $getInitState;
    this.$saveInitState = $saveInitState;
  }
  
  initialize(conf) {
    super.initialize(conf);
    this._prebindEvents();
		this.stateModel = new BacksideModel();

		this.stateModel.listen({
			'change:showProjectList': (showProjectList/*, m*/) => {
				this.controls[showProjectList ? 'projects' : 'items'].style.display = '';
				this.controls[!showProjectList ? 'projects' : 'items'].style.display = 'none';
				
				if(this.controls.items.parentNode.style.display == 'none'){
					this.stateModel.change('hideListPanel', false);
				}
			},
			'change:hideListPanel': (hideListPanel, m) => {
				this.controls.items.parentNode.style.display = hideListPanel ? 'none' : '';
				this.controls.toggleListBtn.textContent = hideListPanel ? '>' : '<';
				// the application saves its states each time the property is changed
				this.$saveInitState(m.attr);
			},
			// Attention: gridId converting to gridScheme 
			'change:gridScheme': (code) => {
				this.controls.space1.style.display = (code & SPACE1) ? '' : 'none';
				this.controls.space2.style.display = (code & SPACE2) ? '' : 'none';
				this.controls.space3.style.display = (code & SPACE3) ? '' : 'none';
				this.controls.space4.style.display = (code & SPACE4) ? '' : 'none';

				if (code & SPACE2 || code & SPACE4) {
					this.controls.half2.style.display = '';
				} else {
					this.controls.half2.style.display = 'none';
				}

				if (code & HORIZONTAL) {
					this.controls.grid.style.flexDirection = 'column';
					this.controls.half1.style.flexDirection = 'row';
					this.controls.half2.style.flexDirection = 'row';
				} else {
					this.controls.grid.style.flexDirection = 'row';
					this.controls.half1.style.flexDirection = 'column';
					this.controls.half2.style.flexDirection = 'column';
				}
			},
			'change:themeId': (themeId) => {
				var 	className;
				
				switch (themeId) {
					case 'dark': className = 'theme-dark'; break;
					case 'theme-a': className = 'theme-a'; break;
					case 'theme-b': className = 'theme-b'; break;
					case 'theme-c': className = 'theme-c'; break;
					case 'theme-d': className = 'theme-d'; break;
					case 'theme-e': className = 'theme-e'; break;
				}
	
				this.controls.grid.className = 'sc_layout-right grid_column ' + className;
			},
      'change:hp1': (value_n, m_o) => {
        this.controls.half1.style.flexGrow = Math.pow(2, value_n);
      },
      'change:vp1': (value_n, m_o) => {
        this.controls.space1.style.flexGrow = Math.pow(2, value_n);
        this.controls.space2.style.flexGrow = Math.pow(2, value_n);
      },
		});
  }
  
  /**
   * @param {ProjectModel} model
   * @return {void}
   */
  initProject(model) {
  this.model = model;
	this.model.listen({
	  'change:current_doc': (id) => {
	    if (!this.subView[id]) return;
		  
	    this.openTab(id);
	    // Focusing an HtmlEditor if a view has an editor 
	    this._stayFocusOnDoc(id);
	  },
	  'change:gridId': (gridId) => {
	    this.changeGrid(gridId);
	  },
	  'change:opened_ids': (openedIds) => {
	    for(var i = 0; i < openedIds.length; i++){
	      openedIds[i] !== null && this.openTab(openedIds[i], 1 << i); // 1<<0 == 1, 1<<1 == 2 
	    }
	  },
	  'destroy': () => {
	    $4.emptyNode(this.controls.items);
	    var 	id,
				    docs = this.model.get('docs');
	    
	    for(id in docs) {
		    docs[id].destroy();
	    }
	    for(id in this.subView) {
		    if (this.subView[id]) this.subView[id].remove();
	    }
	  },
	  'add': (documentModel) => {
	    this.appendDocument(documentModel);
	  },
	  'change:remoteDocId': (remoteDocId) => {
	    console.log('[change:remoteDocId] %s', remoteDocId);
	    window.history.pushState({remoteDocId}, 'Project', '?project=' + encodeURIComponent(remoteDocId));
	  },
	});
	// Attention: Quick and dirty method to find the next available document by <pre> node at DOM
	this.bus.on('focus_next_doc', function(v){
		var 	openedDocs = this.model.get('opened_ids');
		var 	pos = openedDocs.indexOf(v.model.get('id'));
		var		checkList = Array.prototype.concat.call(openedDocs.slice(pos + 1), openedDocs.slice(0, pos));
			
		for (var i = 0 ; i < checkList.length; i++) {
		  let subView = this.subView[checkList[i]];
		  if (!subView || !subView.htmlEdit) continue;
			
		  subView.htmlEdit.el.focus();
		  setTimeout(function(){
			  subView.htmlEdit.setCursor(subView._lastPos || 0);
		  }, 60);
		  // subView.htmlEdit.setCursor(subView._lastPos || 0);
		  break;
		}
	}.bind(this));

		let  	docs = this.model.get('docs');
		let		openedIds = this.model.get('opened_ids');

		for (let id in docs) {
			this.appendDocument(docs[id], true);	
		}
    
    // stateModel defines a state of the IDE		
		this.stateModel.change(
		  Object.assign({ // Merge in default settings
		    showProjectList: false,
		    hideListPanel: false,
		    gridId: '7',
		    gridScheme: 0 | SPACE1,
		    themeId: 'light',
		  }, this.$getInitState && this.$getInitState() || {})
		);
		if(openedIds) this.model.change('opened_ids', openedIds, true);
    // Attention: force triggering current_doc will reopen the document and change the list of opened documents!
    this._stayFocusOnDoc(this.model.get('current_doc'));
    this.controls.projectTitle.value = this.model.get('title') || 'noname';

      CtxMenu2({
        label: this.controls.toppanelMenuLabel,
        menu: this.controls.toppanelMenuList,
        active_cls: '__active',
      });
    }

  /**
   * @param {string} id - a document id
   * @return {void}
   */
	_stayFocusOnDoc(id) {
		const currentView = this.subView[id];
    
		if (!currentView || !currentView.htmlEdit) return;
    
    setTimeout(function(){
      currentView.htmlEdit.el.focus();
    }, 100);
	}
  
  /**
   * @return {void}
   */
  _saveModel() {
    if (!LOCALSTORAGE_AVAILABLE) return;
    setTimeout(() => {
      try {
        window.localStorage['lastsnapshot'] = JSON.stringify(this.model.createProjectSnapshot());	
      } catch(e) {
        if (e.name == 'QuotaExceededError') {
          console.warn("Not enought spaces granted for localStorage");
        }
      }
    }, 200);	
  }

	appendDocument(docModel, isSilent) {
		var 	hInstance,
          view,
          id = docModel.get('id');

		this.renderMenuItem(docModel.attr);

		switch (docModel.get('mime')) {
			case 'text/css': hInstance = new SHighlighter(HighlighterSets.css); break;
			case 'application/json':
			case 'application/javascript': hInstance = new SHighlighter(HighlighterSets.js); break;
			case 'text/xml': 
			case 'text/html': hInstance = new SHighlighter(HighlighterSets.html); break;
			case 'text/gettext': hInstance = new SHighlighter(HighlighterSets.gettext_po); break;
      case 'text/markdown': hInstance = new SHighlighter(HighlighterSets.markdown); break;
		}

		view = new EditView({
			highlight: hInstance,
			model: docModel,
			// Turn off line numeration for Markdown
			numerateLines: docModel.get('mime') != 'text/markdown',
			parent: this, // Reference to the application
		});

		view.htmlEdit.setText(docModel.get('content') || '');
		view.htmlEdit.setCaretPos(0);
		view.htmlEdit._history.add({
			text: docModel.get('content') || '',
			start: 0,
			end: 0
		});

		view.el.style.display = 'none';
		this.subView[id] = view;
		
		if (!isSilent) {
			this.model.change('current_doc', id);
		}

		// Create presentation of document
		if (docModel.get('mime') == 'text/html') {
			let 	presentationId = docModel.getPresentationID(),
            presentationView = new FrameView({
              appModel: this.model, // add reference to app model
              model: docModel,
            });

			this.subView[presentationId] = presentationView;
		}
    
    docModel.listen({
      'close': function(m, docView){
        this.model.closeSpace(m.get('id'));

        if (this.model.get('current_doc') == m.get('id')) {
          this.model.change('current_doc', null);
        }
      }.bind(this),
      'change:focus': function(isFocus, m){
        const docId = m.get('id');
        const docListItem = this.listItems[docId];
        
        this.model.set('current_doc', docId);

        if (docListItem) docListItem.classList[isFocus ? 'add' : 'remove']('__current');
      }.bind(this),
      'destroy': function(m){
        var 	id = m.get('id'),
              docListItem = this.listItems[id];
        
        if (docListItem) docListItem.remove();
        
        this.subView[id] = null;
        delete this.subView[id];

        if (
          m.get('mime') == 'text/html' 
          || m.get('mime') == 'application/javascript'
        ){
          let 	presentationId = m.getPresentationID();
          this.subView[presentationId] = null;
          delete this.subView[presentationId];
        }

        let docs = this.model.get('docs');
        docs[id] = null;
        delete docs[id];
        this._saveModel();
      }.bind(this),
      'change:content': function(content, m){
        this._saveModel();
      }.bind(this),
      'change:title': function(title, m){
        var 	docMenuItem = this.listItems[m.get('id')],
              $title = docMenuItem.querySelector('.sc_nav-tab_name');

        $title.textContent = title;	

        if (m.previous.hasOwnProperty('title')) {
          delete this.model.docIDMap[m.previous.title];
        }
        this.model.docIDMap[m.get('title')] = m.get('id');
      }.bind(this),
    });
	}
  
  // @param {string} [foregroundId] - id of the opened project
  startNewProject(foregroundId) {
    if(this.model) this.model.destroy(); // Trigger destroy event

    this.initProject(ProjectModel.createEmpty());
    this.bus.trigger('start_new_project', this, foregroundId);
  }
  
 	renderMenuItem(conf) {
		var 	div = document.createElement('div'),
          src = '<span class="sc_nav-tab_name">' + BacksideUtils.escape(conf.title) + '</span>';

		if (conf.mime == 'text/html' || conf.mime == 'application/javascript' || conf.mime == 'text/markdown') {
			src += '<span class="sc_nav-tab_compile-btn" data-role="compile-btn">' + VOC.load_page_btn + '</span>';
		}

		src += '<span class="sc_nav-tab_actions-btn" data-role="actions-btn">&#8942;</span>';
		div.className = 'sc_nav-tab';
		div.setAttribute('data-id', conf.id);
		div.dataset.id = conf.id;
		div.innerHTML = src;
		this.controls.items.appendChild(div);
		this.listItems[conf.id] = div;
	}
	// @param {String} id - document id
	// @param {Int} spaceCode - id code of space cell, optional
	openTab(id, spaceCode) {
		let code = this.stateModel.get('gridScheme');
    let space_code = spaceCode;
    let $space, spaceId;

		if (!space_code || !(code & space_code)) {
			if (code & SPACE1 && !this.controls.space1.firstElementChild) { // Find available space
				space_code = SPACE1;
			} else if (code & SPACE2 && !this.controls.space2.firstElementChild) {
				space_code = SPACE2;
			} else if (code & SPACE3 && !this.controls.space3.firstElementChild) {
				space_code = SPACE3;
			} else if (code & SPACE4 && !this.controls.space4.firstElementChild) {
				space_code = SPACE4;
			} else {
				space_code = SPACE1; 
			}
		} // else land to a determined space-cell

		switch (space_code) {
			case SPACE1: $space = this.controls.space1; spaceId = 0; break;
			case SPACE2: $space = this.controls.space2; spaceId = 1; break;
			case SPACE3: $space = this.controls.space3; spaceId = 2; break;
			case SPACE4: $space = this.controls.space4; spaceId = 3; break;
			default: $space = this.controls.space1; spaceId = 0; break;
		}

		this.model.spaceChange(spaceId, id);
		$4.emptyNode($space);

		if (this.subView[id]) {
			let docView = this.subView[id];
			$space.appendChild(docView.el);
			docView.el.style.display = '';

      if(docView instanceof FrameView || docView instanceof JsConsole || docView instanceof MarkdownViewer){
				docView.refresh(this);
			}
		}
	}

  openAboutPopup() {
		createAboutPopup(
      VOC.aboutApp.replace('%d', VER),
      this
    ).open();
	}
};
	
MainView.prototype.events = {
  'onclick items': function(e){
    let $tab = $4.closest(e.target, '.sc_nav-tab');
    if (!$tab) return;
    
    let role = e.target.dataset && e.target.dataset.role;
    let doc = this.model.get('docs')[$tab.dataset.id];
    //=========================================
    // TODO refactor opening document
    // SET focus on new document not add class Here!
    //=========================================
    if (role == 'compile-btn') {
      let 	presentationId = doc.getPresentationID();

      if (!this.subView[presentationId]) { // Add presentation view on demand
        if (doc.get('mime') == 'application/javascript') {
          this.subView[presentationId] = new JsConsole({
            appModel: this.model, // add reference to app model
            model: doc,
          });							
       } else if (doc.get('mime') == 'text/markdown') {
          this.subView[presentationId] = new MarkdownViewer({
            appModel: this.model, // add reference to app model
            model: doc,
          });	
        }
      }
      if (this.subView[presentationId] != null){
        this.model.change('current_doc', doc.getPresentationID());
      } else {
        console.warn('No presentation view: %s', presentationId);
      }
    } else if (role == 'actions-btn') {
      e.stopPropagation();

      CtxMenu({
        target: e.target,
        onclick: function(role){
          if (role == 'remove-document') {
            // Attention: Removing trigger destroy and close events
            doc.destroy();
          } else if(role == 'download-document') {
            downloadFileFromText(doc.get('title'), doc.getSource());
          } else if(role == 'rename-document') {
            createRenameDocPopup(
              VOC.popupRenameDoc_title.replace('%s', doc.get('title')),
              doc
            ).open();
          }
        }.bind(this)
      }, [
        {label: VOC.remove_document, role: 'remove-document'},
        {label: VOC.download_document, role: 'download-document'},
        {label: VOC.rename_document, role: 'rename-document'},
      ]);
    } else {
      console.log('before change current_doc %s', $tab.dataset.id);
      this.model.change('current_doc', $tab.dataset.id);
    }
  },
  'onclick toolsAddBtn': function(){ // Add new document
    createDocumentPopup(this.model, this).open();
  },
  'onclick lastProjectsBtn': function(){
    this.stateModel.change('showProjectList', !this.stateModel.get('showProjectList'));
  },
  'onclick toggleListBtn': function(){
    this.stateModel.change('hideListPanel', !this.stateModel.get('hideListPanel'));
  },
  'onclick settingsBtn': function(e) {
    createSettingsPopup(this).open();
  },
  'onchange importProject': function(e) {
    var file = e.target.files[0];

    if (!file) return;
    
    let fr = new FileReader();

    fr.onload = function(e){      
      const prj = JSON.parse(e.target.result);
      const projectModel = new ProjectModel(prj.model);

      if(this.model) this.model.destroy(); // Trigger destroy event
      this.initProject(projectModel);
      this.model.change('opened_ids', prj.model.opened_ids);

      this._stayFocusOnDoc(prj.model.current_doc);
    }.bind(this);
    fr.onerror = function(e){
      console.log('File reader error');
      console.dir(e);
    };
    fr.readAsText(file);
    e.target.value = ''; // reset input
  },
  'onclick exportProject': function(){
    if (!this.model) return;
    downloadFileFromText((this.model.get('title') || 'noname') + '.json', JSON.stringify(this.model.createProjectSnapshot()));
  },
  'onclick clearProject': function(){
    this.startNewProject(true);
  },
  'onclick saveProject': function(){
    this.model.save();
  },
  'onchange projectTitle': function(e){
    this.model.change('title', e.target.value);
  },
  'onclick aboutBtn': function(e){
    this.openAboutPopup();
  },
  'onclick uploadProject': function(e) {
    if (!this.model) return;
    this.model.save();
  },
};

module.exports = MainView;

},"/app/source/index":function anonymous(module,require
) {
const MainView = require('./MainView');
const DocumentModel = require('./DocumentModel');
const ProjectModel = require('./ProjectModel');
const Configs = require('./Configs');
const createDefaultProject = require('./defaultProject');
const createTestProject = require('./testProject');
const BacksideUtils = require('../../packages/backside/utils'); 


// Attention: If url contains `?project=` application make attempt to download data from server
var 	QUERY_OPTIONS = BacksideUtils.parseQuery(),
			LOCALSTORAGE_AVAILABLE = Configs.LOCALSTORAGE_AVAILABLE,
			prevPrjData;

//==========================================
// App
//==========================================
var App = new MainView(
  {el: document.body}, 
  LOCALSTORAGE_AVAILABLE &&
    (function(){
      var _initStateData = BacksideUtils.saveParse(window.localStorage.getItem('statesnapshot')) || {};
        return function() {
          return _initStateData;
        };
    }()),
  function(saveState_o) {
    if (!LOCALSTORAGE_AVAILABLE) return;
    setTimeout(function(){
      window.localStorage['statesnapshot'] = JSON.stringify(saveState_o);
    }, 200);
  }
);

document.onreadystatechange = function(){
  if(document.readyState == 'complete'){
    // Create default 
    App.controls.loadDefaultProject.onclick = function(){
      if(App.model) App.model.destroy(); // Trigger destroy event
      App.initProject(createDefaultProject());
    };
    App.controls.loadTestProject.onclick = function(){
      if(App.model) App.model.destroy(); // Trigger destroy event
      App.initProject(createTestProject());
    };
  }
}
// Here we can listen changes and save data (if necessery)
App.bus.on('start_new_project', function(app, foregroundId){
  setTimeout(function(){
    App.openAboutPopup();
  }, 200);
});	


if (!LOCALSTORAGE_AVAILABLE) {
  App.startNewProject();
}

const initStateData = BacksideUtils.saveParse(window.localStorage.getItem('statesnapshot')) || {};
const stateData = Object.assign({ // Merge in default settings
  showProjectList: false,
  hideListPanel: false,
  gridId: '7',
  gridScheme: 0 | 0x1,
  themeId: 'light',
}, initStateData);

if (QUERY_OPTIONS.project) {
  if (App.model) {
    console.warn('Model is already defined');
    return;
  }
  ProjectModel.load(QUERY_OPTIONS.project).then(resp => {
    const docs = resp.data.model.docs;
    
    if (App.model) App.model.destroy();
    const 	projectModel = new ProjectModel(resp.data.model);
    App.initProject(projectModel, stateData);
  }, error => {
    console.warn('Impossible to load %s', QUERY_OPTIONS.project);
  });
} else if (	
  (prevPrjData = BacksideUtils.saveParse(window.localStorage.getItem('lastsnapshot')))
) {
  if (App.model) App.model.destroy(); // Trigger destroy event

  const 	projectModel = new ProjectModel(Object.assign({ // Merge in default settings
    title: '',
    opened_ids: Array(4), // already opened documents
    current_doc: 0, // id of current focused doc
    docs: {},
    counter: 0
  }, prevPrjData.model));

  App.initProject(projectModel, stateData);
} else {
  App.startNewProject();
}

}},this,{"/packages/backside/events":"/packages/backside","/packages/backside/model":"/packages/backside","/app/source/DocumentModel":"/app/source","/app/source/instances.axios":"/app/source","/packages/backside/utils":"/packages/backside","/app/source/LimitedStack":"/app/source","/app/source/Configs":"/app/source","/app/source/keycodes":"/app/source","/app/source/HtmlEditor.keybindings":"/app/source","/app/lib/each.utils":"/app/lib","/packages/$4/index":"/packages/$4","/app/source/ProjectModel":"/app/source","/packages/backside/view":"/packages/backside","/app/source/HtmlEditor":"/app/source","/app/source/ExtMimeMap":"/app/source","/app/lib/cr":"/app/lib","/app/source/vocabulary":"/app/source","/app/lib/PopupBuilder":"/app/lib","/app/source/testProject":"/app/source","/app/source/defaultProject":"/app/source","/app/source/reactProject":"/app/source","/app/lib/BasePopupView":"/app/lib","/packages/viewcompiler/viewcompiler":"/packages/viewcompiler","/app/source/spaces":"/app/source","/app/source/EditView":"/app/source","/app/source/MarkdownViewer":"/app/source","/app/source/JsConsole":"/app/source","/app/source/FrameView":"/app/source","/app/source/SHighlighter":"/app/source","/app/source/HighlighterSets":"/app/source","/app/lib/downloadFile":"/app/lib","/app/lib/ctxMenu":"/app/lib","/app/source/about.popup":"/app/source","/app/source/renameDocument.popup":"/app/source","/app/source/createDocument.popup":"/app/source","/app/source/settings.popup":"/app/source","/app/source/MainView":"/app/source","/app/source/index":"/app/source"},""))._executeModule("/app/source/index");