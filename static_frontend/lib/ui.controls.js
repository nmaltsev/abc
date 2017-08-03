;(function(ENV){
var		_MOVEABLE_CLASS = '__moveable',
		BasePopupView;


// Engine on native Drag&Drop API
// @param {DomElement} element
function DragMovingController(element, target){
	this.element = element;
	this.target = (target || element);
	this.target.setAttribute('draggable', 'true');
	this.isAllowMoving = true;
	
	// Transparent image while dragging
	var dragImage = document.createElement('img');
	dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
	this.dragImage = dragImage;
	
	var 	offset = {
				x: undefined,
				y: undefined
			},
			marginCorrection = { // в FF && Chrome надо компенсировать значение margin
				x: -parseInt($4.getStyle(this.element, "margin-left"), 10),
				y: -parseInt($4.getStyle(this.element, "margin-top"), 10)
			},
			isActive = false; // Fix status (not needed in Chrome, it for FF);
			
	this.handlers = {
		dragOverHandler: function(e){
			e.stopPropagation();
			e.preventDefault();
			e.dataTransfer.effectAllowed = 'move';

			if(isActive && this.isAllowMoving){
				element.style.left = e.clientX - offset.x + marginCorrection.x + "px";
				element.style.top = e.clientY - offset.y + marginCorrection.y + "px";
				element.style.transform = 'none';
				element.style.mozTransform = 'none';
				element.style.webkitTransform = 'none';

			}
		}.bind(this),
		
		dragStartHandler: function (e){
			e.dataTransfer.setDragImage && e.dataTransfer.setDragImage(this.dragImage, 0, 0);	// TODO maybe change position an image for changing cursor!	
			e.stopPropagation();
			e.dataTransfer.setData('Text', "Test text"); // required otherwise doesn't work
			e.dataTransfer.effectAllowed = 'move';
			
			offset.x = e.offsetX || e.layerX; 
			offset.y = e.offsetY || e.layerY;

			element.style.webkitTransform = 'none';
			element.style.msTransform = 'none';
			element.style.mozTransform = 'none';
			element.style.transform = 'none';

			element.style.left = e.clientX - offset.x + marginCorrection.x + "px";
			element.style.top = e.clientY - offset.y + marginCorrection.y + "px";

			isActive = true;
		}.bind(this),
		dragEndHandler: function(e){
			e.stopPropagation();
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			isActive = false;
		},
		drop: function(e){
			e.stopPropagation();
			e.preventDefault();	
		}
	};	
	this.target.addEventListener('dragstart', this.handlers.dragStartHandler);
    document.addEventListener("dragover", this.handlers.dragOverHandler);
    document.addEventListener("dragend", this.handlers.dragEndHandler);
    document.addEventListener('drop', this.handlers.drop);
};
DragMovingController.prototype = {
	resumeMoving: function(){
		this.isAllowMoving = true;
	},
	stopMoving: function(){
		this.isAllowMoving = false;
	},
	destroy: function(){
		this.target.removeEventListener("dragstart", this.handlers.dragStartHandler);
		document.removeEventListener("dragover", this.handlers.dragOverHandler);
	    document.removeEventListener("dragend", this.handlers.dragEndHandler);
	    document.removeEventListener('drop', this.handlers.drop);
		this.handlers = null;
		this.element = this.target = null;
	},
};

// Engine that emulate native drag&drop api by mouse events
// @param {DomElement} element
function MouseMovingController(element, target){
	this.element = element;
	this.target = (target || element);
	this.target.setAttribute('draggable', 'true');
	this.isAllowMoving = true;

	var 	offset = {
				x: undefined,
				y: undefined
			},
			marginCorrection = { // в FF && Chrome надо компенсировать значение margin
				// Attention: Chrome calculate borderWidth to popup width, but not Firefox! So don't use border to popup node!
				x: -parseInt($4.getStyle(this.element, "margin-left"), 10) /* - parseInt($UI.helpers.getStyle(this.element, "border-left-width"), 10)*/,
				y: -parseInt($4.getStyle(this.element, "margin-top"), 10) /* - parseInt($UI.helpers.getStyle(this.element, "border-top-width"), 10)*/
			},
			isActive = false; // Fix status (not needed in Chrome, it for FF);
			
	this.handlers = {
		mousemove: function(e){
			if(isActive && this.isAllowMoving){
				element.style.left = e.clientX - offset.x + marginCorrection.x + "px";
				element.style.top = e.clientY - offset.y + marginCorrection.y + "px";
				element.style.WebkitTransform = 'none';
				element.style.MozTransform = 'none';
				element.style.MsTransform = 'none';
				element.style.transform = 'none';
			}
		}.bind(this),
		
		mousedown: function (e){
			offset.x = e.offsetX || e.layerX; 
			offset.y = e.offsetY || e.layerY;
			element.style.WebkitTransform = 'none';
			element.style.MozTransform = 'none';
			element.style.MsTransform = 'none';
			element.style.transform = 'none';
			element.style.left = e.clientX - offset.x + marginCorrection.x + "px";
			element.style.top = e.clientY - offset.y + marginCorrection.y + "px";

			isActive = true;
		}.bind(this),
		mouseup: function(e){
			isActive = false;
		}.bind(this),
		dragstart: function(e){
			e.stopPropagation();
			e.preventDefault();	
		}
	};	
	
	this.target.addEventListener('mousedown', this.handlers.mousedown);
    document.addEventListener("mousemove", this.handlers.mousemove);
    document.addEventListener("mouseup", this.handlers.mouseup);
    this.target.addEventListener('dragstart', this.handlers.dragstart);
};
MouseMovingController.prototype = {
	resumeMoving: function(){
		this.isAllowMoving = true;
	},
	stopMoving: function(){
		this.isAllowMoving = false;
	},
	destroy: function(){
		this.target.removeEventListener("mousedown", this.handlers.mousedown);
		document.removeEventListener("mousemove", this.handlers.mousemove);
	    document.removeEventListener("mouseout", this.handlers.mouseout);
	    this.target.removeEventListener('dragstart', this.handlers.dragstart);
		this.handlers = null;
		this.element = this.target = null;
	}
};

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

// How to access popups at stack: ENV.$UI.BasePopupView.prototype.stack

// Popup View
// @param {Object} conf
// @param {HtmlElement} conf.heap - popups container, default #node-heap or document.body
// @param {Function} conf.onopen
// @param {Function} conf.onclose
{
	BasePopupView = Backside.extend(function(conf){
		Backside.View.call(this, conf);
	}, Backside.View);
	BasePopupView.prototype.className = 'dwc_popup';
	BasePopupView.prototype.stack = []; // stack for opened popups
	// destroyOnClose
	BasePopupView.prototype.initialize = function(conf){
		if(conf.el){
			this.el = conf.el;
		}else{
			this.el = document.createElement(conf.tagName || 'div');
			this.el.className = this.className + (conf.className ? ' ' + conf.className : '');
		}

		this.children = {};
		this.render(conf);
		this.el.style.display = 'none';
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
			e.keyCode == 27 && this.close();
		}.bind(this));
		this.on('content', 'click', function(e){
			e.stopPropagation();
		}.bind(this));
	};
	BasePopupView.prototype.render = function(conf){
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
	};
	BasePopupView.prototype.remove = function(){
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
	};
	BasePopupView.prototype.open = function(){
		this.onOpen(this);
		document.documentElement.style.overflow = 'hidden';
		document.body.overflow = 'hidden';
		this.el.style.display = '';
		this.stack.push(this);
	};
	// if onClose return true close would be canceled
	BasePopupView.prototype.close = function(status){
		this.onClose(this, status) || this._completeClose();
		
	};
	BasePopupView.prototype._completeClose = function(){
		this.el.style.display = 'none';
		document.documentElement.style.overflow = '';
		document.body.overflow = '';
		this.destroyOnClose && this.remove();
	};
	BasePopupView.prototype._bindEvents = function(events){
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
	};
}

// @param {Object} conf.events
// @param {String} conf.className
var PopupBuilder = function(conf, extend){
	if(extend != null) Object.assign(this, extend);
	this.el = document.createElement('div');
	this.el.className = conf.className;
	this.el.style.display = 'none';
	this.el.setAttribute('tabindex', 0);
	this.initialize(conf);
}
PopupBuilder.prototype = Object.create(Backside.Events);
PopupBuilder.prototype.stack = [], // stack for opened popups
PopupBuilder.prototype.CATCH_DEFIS = /-(\w)/g;
PopupBuilder.prototype._replaceDefis = function(str, p) {return p.toUpperCase();};
PopupBuilder.prototype._bindByRole = function($target){
	var 	roleNodes = ($target || this.el).querySelectorAll('[data-co]'),
			i = roleNodes.length;

	while(i-- >0){
		field = roleNodes[i].dataset.co.replace(this.CATCH_DEFIS, this._replaceDefis);
		this.controls[field] = roleNodes[i];
	}
};
PopupBuilder.prototype._bindEvents = function(events){
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
};
PopupBuilder.prototype.initialize = function(conf){
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
};
PopupBuilder.prototype.render = function(conf){
	this.controls = {};
	this.el.innerHTML = this.template.replace('%title%', conf.title || '').replace('%content%', conf.content || '');
	this._bindByRole();
	if(conf.events) this._bindEvents(conf.events);
};
PopupBuilder.prototype.template = 
'<div class="dwc_popup-wrap">' +
	'<div class="dwc_popup-content" data-co="content">' +
		'<div class="dwc_popup-header" data-co="popup-title">%title%</div>' +
		'<div class="dwc_popup-body clearfix" data-co="body">%content%</div>' +
	'</div>' +
	'<div class="m3_middle_helper"></div>' +
'</div>';
PopupBuilder.prototype.remove = function(){
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
};
PopupBuilder.prototype.open = function(){
	if(this.onopen) this.onopen(this);
	document.documentElement.style.overflow = 'hidden';
	document.body.overflow = 'hidden';
	this.el.style.display = '';
	this.stack.push(this);
	return this;
};
PopupBuilder.prototype.close = function(status){
	this.onclose && this.onclose(this, status) || this._completeClose();
};
PopupBuilder.prototype._completeClose = function(){
	this.el.style.display = 'none';
	document.documentElement.style.overflow = '';
	document.body.overflow = '';
	this.destroyOnClose && this.remove();
};


if(ENV.DPROVIDER){
	ENV.DPROVIDER.define(null, function UIC(){
		return {
			BasePopupView: BasePopupView,
			Popup: PopupBuilder
		};
	});
}else{
	ENV.$UI = {
		BasePopupView: BasePopupView,
		Popup: PopupBuilder
	};
}
}(this))