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
