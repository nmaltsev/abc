var $UI = {
	events: {
		dropDownSelected: document.createEvent('MouseEvents'),
		visualInputChange: document.createEvent('MouseEvents'),
	},
	helpers: {},
};
$UI.events.dropDownSelected.initMouseEvent('dropdownselected', true, true, window, 1, 12, 345, 7, 220, false, false, true, false, 0, null);
$UI.events.visualInputChange.initMouseEvent('visualinputchange', true, true, window, 1, 12, 345, 7, 220, false, false, true, false, 0, null);
// init controls
//		Custom drop down menu - <span class="dwc_dropdown" data-component="dropdown" data-value="Drop down" data-id="0" data-list="0;item1;1;item2;2;item3;3;item4;4;item5;5;item6;6;item7"></span>
$UI.initControlDelegation = function(){
	document.addEventListener('click', function(e){
		if(e.target.dataset && e.target.dataset.component == 'dropdown'){ // handle drop down clicks
			var 	itemStr,
					itemList,
					OPENED_CLASS = '__opened',
					menu,
					dropDown = e.target,
					_mode =  dropDown.dataset.mode,
					_close = function(){
						dropDown.classList.remove(OPENED_CLASS);
						dropDown.onmouseout = null;
						if(menu){
							menu.style.height = 0;
							menu.style.zIndex = 1;
							menu.onclick = null;	
						}
					};

			if(dropDown.classList.contains(OPENED_CLASS)){
				dropDown.classList.remove(OPENED_CLASS);
				menu = dropDown.querySelector('.dwc_dropdown_menu');
				_close();
			}else{
				while(dropDown.firstChild) dropDown.removeChild(dropDown.firstChild);
				itemStr = dropDown.dataset.list || '',
				currentId = dropDown.dataset.id,
				itemList = itemStr.split(';'),
				menu = document.createElement('div');
				menu.className = 'dwc_dropdown_menu';	

				// set menu position
				menu.style.left = '0px';
				menu.style.top = dropDown.clientHeight + 'px';

				for(var i = 0; i < itemList.length; i += 2){
					if(!itemList[i] || !itemList[i+1]) continue;
					var item = document.createElement('div');
					item.textContent = itemList[i+1];
					item.dataset.id = itemList[i];
					item.dataset.value = itemList[i+1];
					item.className = 'dwc_dropdown_item ' + (itemList[i] == currentId ? '__current' : ''); 
					menu.appendChild(item);
				}

				dropDown.appendChild(menu);
				dropDown.classList.add(OPENED_CLASS);
				menu.style.height = menu.scrollHeight + 'px';

				dropDown.onmouseout = function(e){
					var toElement = e.toElement || e.relatedTarget;

					if(toElement && !$4.isChildOf(toElement, dropDown)){
						_close();
					}
				}
				menu.onclick = function(e){
					var id = e.target.dataset.id;
					
					if(id){
						dropDown.dataset.id = id;
						dropDown.setAttribute('data-id', id);

						if(_mode != 'btn'){
							dropDown.dataset.value = e.target.dataset.value;
							dropDown.setAttribute('data-value', e.target.dataset.value);	
						}

						dropDown.dispatchEvent($UI.events.dropDownSelected);
						_close();
					}
				};
			}
		}

		if(e.target.dataset &&  e.target.dataset.component == 'visualinput'){
			var 	$input = e.target;

			/*$input.onkeydown = function(e){ // you need some better if you have fast fingers...
				if(e.keyCode == 13){ // prevent new line
					e.stopPropagation();
					e.preventDefault();
					$input.blur();
				}
			};*/
			// lisen input event
			$input.onblur = function(e){
				var 	buf = e.target.textContent; 
				
				e.target.textContent = '';
				setTimeout(function(){ // Set Position at begin
					e.target.textContent = buf;	
					// Real on change Event here!
					$input.dispatchEvent($UI.events.visualInputChange);

					$input.onkeydown = $input.onblur = null;
					$input = null;
				}, 0);
			};
		}
	});

	document.addEventListener('keydown', function(e){
		if(e.target.dataset.component == 'visualinput'){
			if(e.keyCode == 13){ // prevent new line
				e.stopPropagation();
				e.preventDefault();
				e.target.blur();
			}
			return;
		}
		// -----

	});
};

// Engine on native Drag&Drop API
// @param {DomElement} element
$UI.helpers.DragMovingController = function(element, target){
	this.element = element;
	this.target = (target || element);
	this.target.setAttribute('draggable', 'true');
	this.isAllowMoving = true;
	
	// Transparent image while dragging
	var dragImage = document.createElement("img");
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
$UI.helpers.DragMovingController.prototype = {
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
$UI.helpers.MouseMovingController = function(element, target){
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
$UI.helpers.MouseMovingController.prototype = {
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

$UI._MOVEABLE_CLASS = '__moveable';

// How to access popups at stack: $c.BasePopupView.prototype.stack

// Popup View
// @param {Object} conf
// @param {HtmlElement} conf.heap - popups container, default #node-heap or document.body
// @param {Function} conf.onopen
// @param {Function} conf.onclose
{
	$UI.BasePopupView = Backside.extend(function(conf){
		Backside.View.call(this, conf);
	}, Backside.View);
	$UI.BasePopupView.prototype.className = 'dwc_popup';
	$UI.BasePopupView.prototype.stack = []; // stack for opened popups
	// destroyOnClose
	$UI.BasePopupView.prototype.initialize = function(conf){
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
		this.$heap = conf.heap || $4.id('node-heap') || document.body;
		this.$heap.appendChild(this.el);

		this.onOpen = conf.onopen || function(){};
		this.onClose = conf.onclose || function(){};
		if(conf.css) $4.css(this.controls.content, conf.css);
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
	}
	$UI.BasePopupView.prototype.render = function(conf){
		this.controls = {};
		this.el.innerHTML = '<div class="dwc_popup-wrap">' +
			'<div class="dwc_popup-content" data-co="content">' +
				'<div class="dwc_popup-header" data-co="header">' + (conf.title || '') + '</div>' +
				'<div class="dwc_popup-body clearfix" data-co="body">' + (conf.content || '') + '</div>' +
			'</div>' +
			'<div class="m3_middle_helper"></div>' +
		'</div>';
		this.bindByData(this.el);
		conf.popupEvents && this._bindEvents(conf.popupEvents);
	};
	$UI.BasePopupView.prototype.remove = function(){
		this.dragEngine && this.dragEngine.destroy && this.dragEngine.destroy();
		
		$m.each(this.children, function(view){
			view.remove();
		});
		this.off();
		$4.removeNode(this.el);
		this.model && this.model.off();
		// Remove popup from stack
		var stackPos = this.stack.indexOf(this);
		stackPos != -1 && this.stack.splice(stackPos, 1);

		return this;
	};
	$UI.BasePopupView.prototype.open = function(){
		this.onOpen(this);
		document.documentElement.style.overflow = 'hidden';
		document.body.overflow = 'hidden';
		this.el.style.display = '';
		this.stack.push(this);
	};
	$UI.BasePopupView.prototype.close = function(status){
		this.onClose(this, status)
		this.el.style.display = 'none';
		document.documentElement.style.overflow = '';
		document.body.overflow = '';
		this.destroyOnClose && this.remove();
	};
	$UI.BasePopupView.prototype._bindEvents = function(events){
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

// TODO remove backbone

// // Visual input view
// // @input {Object} conf
// // @input {Object} conf.postfix {String} - postfix value
// // @input {Object} conf.value {String} - editable value
// // @input {Object} conf.input {Function} - onInput callback
// // @input {Object} conf.change {Function} - onChange callback
// $UI.VisualInputView = Backbone.View.extend({
// 	className: 'dwc_visual-input',
// 	tagName: 'span',
// 	initialize: function(conf){
// 		this.el.setAttribute('contenteditable', true);
// 		this.el.innerHTML = conf.value;
		
// 		conf.postfix && this.el.setAttribute('data-postfix', conf.postfix);	
// 		if(conf.oninput) this.oninput = conf.oninput;
// 		if(conf.onchange) this.onchange = conf.onchange;
// 	},
// 	events: {
// 		keydown: function(e){
// 			if(e.keyCode == 13){ // prevent new line
// 				e.stopPropagation();
// 				e.preventDefault();
// 				this.el.blur();
// 			}
// 		},
// 		input: function(e){
// 			this.oninput && this.oninput(e);
// 		},
// 		blur: function(e){
// 			var buf = e.target.textContent; 
// 			e.target.textContent = '';
// 			setTimeout(function(){ // Set Position at begin
// 				e.target.textContent = buf;	
// 			}, 0);
// 			this.onchange && this.onchange();
// 		}
// 	}
// });

// // FileUploader view
// // @input {Object} conf
// // @input {Object} conf.class - custom class
// // @input {Object} conf.btnLabel - custom btn text
// // @input {Functiuon} conf.onchange - custom btn text
// $UI.FileUploaderView = Backbone.View.extend({
// 	className: 'dwc_uploader_label',
// 	tagName: 'label',
// 	events: {
// 		'change [type=file]': function(e){
// 			var 	val = e.target.value.replace("C:\\fakepath\\", "");

// 			this.$file.textContent = val;
// 			this.onchange(val, e, e.target.files);
// 		},
// 		dragenter: function(e){
// 			e.stopPropagation();
// 			e.preventDefault();
// 		},
// 		dragover: function(e){
// 			e.stopPropagation();
// 			e.preventDefault();
// 		},
// 		drop: function(e){
// 			e.stopPropagation();
// 			e.preventDefault();
// 			var 	files = e.originalEvent.dataTransfer.files,
// 					fname;

// 			if(files.length > 0){
// 				fname = files[0].name;
// 				this.$file.textContent = fname;
// 			}else{
// 				this.$file.textContent = '';
// 			}
// 			this.onchange(fname, e, files);
// 		},
// 	},
// 	readFiles: function(files){
// 		_.each(files, function(file){
// 			this.readFile(file);
// 		}.bind(this));
// 	},
// 	render: function(conf){
// 		this.el.innerHTML = 
//     	'<span class="dwc_uploader_file" data-co="file"></span>' +
//     	'<span class="dwc_btn dwc_uploader_btn" data-co="btn">' + _.escape(conf.btnLabel) + '</span>' +
//         '<input type="file" style="opacity:0;position:absolute;left:0;top:0;" data-co="input">' ;
// 		this.el.style.position = 'relative';
// 		this.$file 	=  this.el.querySelector('[data-co=file]');
// 		this.$input =  this.el.querySelector('[data-co=input]');
// 		this.$btn 	=  this.el.querySelector('[data-co=btn]');
// 	},
// 	initialize: function(conf){
// 		this.render(conf);
// 		conf.class && this.el.classList.add(conf.class);
// 		this.onchange = conf.onchange || function(){};
// 		this.onread = conf.onread || function(){};

// 	},
// 	readFile: function(file){
// 		var 	fr = new FileReader(),
// 		        chunkSize = 4096,
// 		        _onread = this.onread,
// 		        chunks = Math.ceil(file.size / chunkSize),
// 		        chunk = 0;

// 		/*function loadNext() {
// 	       	var 	start = chunk * chunkSize, 
// 	       			end = start + chunkSize >= file.size ? file.size : start + chunkSize;

// 	       	fr.onload = function(e) {      
// 	          	_onread(e.target.result, chunk, chunks, (++chunk < chunks) && loadNext);
// 	       	};
// 	       	// fr.readAsArrayBuffer(blobSlice.call(file, start, end));
// 	       	// TODO: use slice() method with vendor prefix in feature
// 	       	fr.readAsArrayBuffer(file.slice(start,end));
// 	    }*/

// 	    // Solution for current time
// 	    function loadNext() {
// 	       	var 	start = chunk * chunkSize, 
// 	       			end = start + chunkSize >= file.size ? file.size : start + chunkSize;

// 	       	fr.onload = function(e) {      
// 	          	_onread(e.target.result, chunks, chunks, undefined);
// 	       	};
// 	       	// fr.readAsArrayBuffer(blobSlice.call(file, start, end));
// 	       	// TODO: use slice() method with vendor prefix in feature
// 	       	fr.readAsArrayBuffer(file);
// 	    }

// 	    loadNext();
// 	},
// });

$UI.notify = function(message){
	// TODO create normal notify
	alert(message);
};

$UI.initControlDelegation();