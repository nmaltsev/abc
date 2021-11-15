(new(class{
  constructor(modules, environment, dir, localRepo){
    this._modules = modules;
    this._stack = {};
    this._global = environment;
    this._dir = dir;
    this._localRepo = localRepo;
  }
  
  _isDefined(modulePath) {
    const modId = this.constructor._path2id(modulePath);
    return this._modules.hasOwnProperty(modId);
  }
  
  _executeModule(modulePath){
    const modId = this.constructor._path2id(modulePath);
    
    if (this._stack.hasOwnProperty(modId)) this._stack[modId]();
    if (!this._modules.hasOwnProperty(modId)) {
      throw('Dependency "%s" was not resolved'.replace('%s', modId));
    } else {
      
      this._modules[modId].call(this._global, this.$module(modId), this.$require(this._dir[modId], this._localRepo));
    }
    
    return this._stack[modId]();
  }
  
  $require(basePath, localRepositoryPath) {
    return moduleId_s => {
      const modulePath = this.constructor._mergePaths(basePath, moduleId_s, localRepositoryPath);
      if (!this._isDefined(modulePath)) {
        // When the module is not defined inside the bundle the app is going to resolve the module with node.js require method
        return typeof(require) === 'function' && require(moduleId_s);
      }
      const r = this._executeModule(modulePath);
      return r;
    };
  }
  
  $module(path_s) {
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
})({"/backside/events":function anonymous(module,require
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

},"/$4/index":function anonymous(module,require
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

},"/backside/model":function anonymous(module,require
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

},"/viewcompiler/viewcompiler":function anonymous(module,require
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
    
    // static LIST_TAGS = 'OL,UL'.split(',') 

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

// Edge browser does not support class' static properties
LoopWatcher.LIST_TAGS = 'OL,UL'.split(',') 


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

    return modelAttr && 
      modelAttr.value && 
      (tagName === 'input' || tagName === 'select' || tagName === 'textarea')
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
      if ($m.has(modelAttr)){
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
        const tagName = $n.tagName.toLowerCase();
        $n.value = initValue;

        if (tagName === 'input' || tagName === 'textarea') {
          // Force set
          $m.trigger('change:' + modelAttr, initValue, $m);
          inputHandler({target: $n});
        } else if (tagName === 'select'){
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
    let alias_s = $n.attributes[LIT.$alias].value;

    $m.trigger('init-ref:' + alias_s, $n, $m);
    subScope.onDestroy((/*ws*/) => {
      $m.trigger('destroy-ref:' + alias_s, $n, $m);
    });

    return subScope;
});


// #5 *for="" *each=""
directiveMap.push(function($n){
  return $n.attributes[LIT.$for] && 
    $n.attributes[LIT.$each] && 
    $n.attributes[LIT.$for].value && 
    $n.attributes[LIT.$each].value;
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

// #6 *attr-enable-<AttributeName>="<model property>"
directiveMap.push(function($n){
  let i_n = $n.attributes.length;
  while (i_n--> 0) if ($n.attributes[i_n].name.includes('*attr-enable-')) return true;
  return false;
}, function($n, $m){	
  const subScope = new AttributeLeaf('*attr-enable', $n);
  let i_n = $n.attributes.length;
  let attr;
  while (i_n --> 0) {
    attr = $n.attributes[i_n];
    if (!attr.name.includes('*attr-enable-')) continue;
    const attrName_s = attr.name.substr(13);
    const modelAttr = attr.value;

    console.log('::ATTR %s %s', attrName_s, modelAttr);

    // Subscribe to attr.value change
    const changeHandler = $m.on('change:' + modelAttr, function(value, m_o) {
      console.log('::[change:%s] %s', modelAttr, value);
      if (!$n || !$n.parentNode) {
        console.log('--');
        return;
      }
      $n[value ? 'setAttribute' : 'removeAttribute'](attrName_s, true);
    });

    subScope.affectedProperties.push('change:' + modelAttr, changeHandler);

    // Initial set
    if ($m.has(modelAttr)){
      const initValue = $m.get(modelAttr);
      console.log('::Init settings %s', initValue);
      $m.trigger('change:' + modelAttr, initValue, $m);
    }
  }
  return subScope;
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

},"/viewcompiler/test/index":function anonymous(module,require
) {
const Model = require('../../backside/model');
const compile = require('../viewcompiler');

// (function(env){
//  console.log('ENV');
//  console.dir(env);
// 	env.viewcompiler = compile;
// 	env.Backside = {Model};
// }(this));

// this||self - is a global scope
(function(exports){
  exports.viewcompiler = compile;
  exports.Backside = {Model};
  Object.defineProperty(exports, '__esModule', { value: true });
}(this || module.exports));

// let model = new Model({prop1: 11});
// model.set('prop2', 2);
// console.dir(model);
// console.dir(this);

}},this,{"/backside/events":"/backside","/$4/index":"/$4","/backside/model":"/backside","/viewcompiler/viewcompiler":"/viewcompiler","/viewcompiler/test/index":"/viewcompiler/test"},""))._executeModule("/viewcompiler/test/index");