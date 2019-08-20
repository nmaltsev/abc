// ControlKit (Ckit) v8 2016/10/27

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
			arguments[i] && this.el.appendChild(arguments[i] instanceof this.constructor ? arguments[i].root : arguments[i]);
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
	

	if(_global.DPROVIDER){
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

