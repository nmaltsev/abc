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
