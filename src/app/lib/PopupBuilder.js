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
