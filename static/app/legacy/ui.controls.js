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


var out = {};

if (typeof(module) != 'undefined') {
  module.exports = out;
} else if (ENV.DPROVIDER) {
	ENV.DPROVIDER.define(null, function UIC(){ return out; });
} else {
	ENV.$UI = out;
}

}(this));
