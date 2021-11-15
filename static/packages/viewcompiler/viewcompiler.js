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
