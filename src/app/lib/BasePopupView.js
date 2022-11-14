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
