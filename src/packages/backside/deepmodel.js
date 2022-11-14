const Events = require('./events');

// Model with nested objects support
function DeepModel(attr){
	Events.call(this);
	this.attr = attr || Object.create(null);
}
DeepModel.prototype = Object.create(Events.prototype);
DeepModel.prototype.constructor = Events;
DeepModel.prototype.SPLITTER = '.';

/**
 * @memberOf {DeepModel} - set value to the model attribute without any event triggering
 * @param {String} name (can be like 'user.group.id')
 * @param {*} value
 */
DeepModel.prototype.set = function(name, value){
	var 	prev;

	if(~name.indexOf(this.SPLITTER)){
		let 	parts = name.split(this.SPLITTER),
					root = this.attr,
					len = parts.length,
					seg;
				
		for(let i = 0; seg = parts[i], i < len - 1; i++){
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

module.exports = DeepModel;
