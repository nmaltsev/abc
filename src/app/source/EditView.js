const HtmlEdit = require('HtmlEditor');
const ExtMimeMap = require('ExtMimeMap');
const BacksideView = require('../../packages/backside/view');
const $4 = require('../../packages/$4/index');

function numberFragment(n){
  var frag = document.createDocumentFragment();

  for(var i = 1, buf; i < n; i++){
    buf = document.createElement('div');
    buf.textContent = i;
    frag.appendChild(buf);
  }

  return frag;
}

function findCloseBracket(str, start){
  var 	pos = start,
        c = -1,
        i = start,
        len = str.length;

  for (; i < len; i++) {
    if (str.charAt(i) == '{') {
      c++;
    } else if (str.charAt(i) == '}') {
      c--;

      if (c === -1) {
        pos = i + 1;
        break;
      }
    }
  }

  return pos;
};

function findOpenBracket(str, end){
  var 	pos = 0,
        c = -1,
        i = end;

  while (i-- > 0) {
    if (str.charAt(i) == '{') {
      c++;

      if (c == -1) {
        pos = i;
        break;
      }
    } else if (str.charAt(i) == '}') {
      c--;
    }
  }

  return pos;
};

class EditView extends BacksideView {
  initialize(conf) {
		super.initialize(conf);
		this.parent = conf.parent;

		if(conf.numerateLines){
			this.model.on('change:linesCount', (count, model) => {
				var prevCount = model.previous.linesCount || 0;

				if(count > prevCount){ // Scroll down
					this.controls.edit.scrollTop += 24 /*18*/; // TODO calculate line height
					$4.emptyNode(this.controls.scale);
					this.controls.scale.appendChild(numberFragment(count + 2));
					this.controls.scale.scrollTop = this.controls.edit.scrollTop;
				}

				this.controls.edit.scrollLeft = 0;
			});
		}else{
			this.controls.scale.style.display = 'none';
		}

		this.htmlEdit = new HtmlEdit(
			this.controls.edit, 
			conf.highlight, 
			{
				onLinesCountUpdate: conf.numerateLines ? function(count){
					this.model.change('linesCount', count);
				}.bind(this) : function(){},
				onChange: function(code){
					this.model.change('content', code);
				}.bind(this)
			},
			this.model
		);
		
		if (
      this.model.get('mime') == ExtMimeMap.js 
      || this.model.get('mime') == ExtMimeMap.json
    ){
			this.htmlEdit._hooks.ALT_B = function(fragment){
				var 	out = fragment;

				try {
					out = JSON.stringify(JSON.parse(fragment), null, '\t');
				} catch(e) {
					out = fragment.replace(/\{|\;|\,/g, function(s){
						return s + '\n';
					}).replace(/\}/g, function(s){
						return '\n' + s;
					});
				}
				return out;
			}
  this.htmlEdit.el.onmousedown = function(e){
    var $target = e.target;

// TODO refactor code
    if($target.classList.contains('sh-js_brackets')){ // Hide block
      e.preventDefault();
      e.stopPropagation();

      let 	isOpen = $target.textContent == '{',
		content = this.model.get('content'),
		posData = this.htmlEdit.getSelection(),
		curPos = posData.end;
					let 	startPos,
		targetPos = this.htmlEdit.getElementPos($target),
		endPos,
		blockCode;

      if (isOpen) {
	      startPos = targetPos;
	      endPos = findCloseBracket(content, startPos);
	      startPos++;
	      endPos--;
      }else{
	      endPos = targetPos;
	      startPos = findOpenBracket(content, endPos + 1);
	      startPos++;
      }

      blockCode = content.substring(startPos, endPos); 
      this.model._hiddenLinePattern.lastIndex = 0;
      
      if (this.model._hiddenLinePattern.test(blockCode)) {
	      return ;
      } 

      content = content.substring(0, startPos) + '%b' + this.model.createCodeBlock(blockCode) + 'b%' + content.substring(endPos);

      if(curPos > startPos){
	      if(curPos <= endPos){ // Cursor in hidden block
		      curPos = startPos + 13;
	      }else{ // Cursor was after hidden block
		      curPos -= blockCode.length - 12; 
	      }
      } 

      posData.sel.removeAllRanges();
      this.htmlEdit.setText(content)
      posData.sel.addRange(this.htmlEdit.setCaretPos(curPos));

  }else if($target.classList.contains('sh-codeblock')){
      e.preventDefault();
      e.stopPropagation();
      let codeBlockId = $target.dataset.id;
      let blocks = this.model.get('blocks');

      let codeBlock = blocks[codeBlockId],
	  content = this.model.get('content'),
	  posData = this.htmlEdit.getSelection(),
	  curPos = posData.end,
	  codeBlockSpace = '%b' + codeBlockId + 'b%',
	  blockSpacePos = this.htmlEdit.getElementPos($target);
							

  content = content.replace(codeBlockSpace, codeBlock);
  blocks[codeBlockId] = null;
  delete blocks[codeBlockId];

  if(curPos > blockSpacePos){
	curPos += codeBlock.length - codeBlockSpace.length; 
  }

  posData.sel.removeAllRanges();
  this.htmlEdit.setText(content);
  posData.sel.addRange(this.htmlEdit.setCaretPos(curPos));
				}
			}.bind(this);
			// Need to restore blocks at copying blocks
			this.htmlEdit._hooks.oncopy = function(code){
				var upd = this.model.getSource(code);
				return upd;
			}.bind(this);

			this.htmlEdit._hooks.onpaste = function(text){
				if (text.length > 10000) {
					var 	repit = true,
                _model = this.model;

					while(repit){
						repit = false;
						text = text.replace(/(\{[^\{\}]+\})/ig, function(str, blockCode){
							repit = true;
							return '%b' + _model.createCodeBlock(blockCode) + 'b%';
						});	
					}
				}
				return text;
			}.bind(this);			
		}

		// Hook for decoding selection with encoded uncode characters
		this.htmlEdit._hooks.ALT_U = function(fragment){
			if(/\\u[a-h0-9]{4}/.test(fragment)){
				return fragment.replace(/\\u([a-h0-9]{4})/ig, function(sub, code){
					return String.fromCharCode(parseInt(code, 16));
				});	
			}else{
				return fragment;
			}
		};

		if(conf.highlight && conf.highlight.commOpen){
			let 	_O = conf.highlight.commOpen, // Aka "Open"
            _C = conf.highlight.commClose, // Aka "Close"
            _OE = '\\' + _O.split('').join('\\'), // Aka "Open Escaped"
            _CE = '\\' + _C.split('').join('\\'),
            _clear1,
            _clear2;

			if (!_C) { // Comment by line
				_clear1 = new RegExp('^' + _OE, 'g');
				_clear2 = new RegExp('\n' + _OE, 'g');
				this.htmlEdit._hooks.CTRL_SLASH = function(fragment){
					if(fragment.substring(0, _O.length) == _O){
						return {
							text: fragment.substring(_O.length).replace(_clear2, '\n'),
							offset: - _O.length // Save offset to shift cursor in single line comment
						};
					}else{
						return {
							text: _O + fragment.replace(/\n/g, '\n' + _O),
							offset: _O.length
						};
					}
				};	
			}else{ // Comment by block
				_clear2 = new RegExp(_CE + '$', 'g');
				this.htmlEdit._hooks.CTRL_SLASH = function(fragment){
					if(fragment.substring(0, _O.length) == _O){
						return {
							text: fragment.substring(_O.length).replace(_clear2, ''),
							offset: - _O.length // Save offset to shift cursor in single line comment
						};
					}else{
						return {
							text: _O + fragment + _C,
							offset: _O.length
						};
					}
				};
			}
		}

		this.model.listen({
			'change:focus': (isFocused/*, m*/) => {
				this.controls.header.parentNode.classList[isFocused ? 'add' : 'remove']('__active');
			},
			'change:title': (title/*, m*/) => {
				this.controls.header.textContent = title;
			},
			'close': () => {
				this.el.remove();
			},
			'destroy': (m) => {
				m.trigger('close', m, this);
				this._removeEventListeners();
				this.remove();
			},
			'updateContent': (m, newContent) => {
				this.htmlEdit.setText(newContent);
				this.htmlEdit.setCaretPos(0);				
			},
		});

		this._removeEventListeners = this._prebindEvents();
		this.controls.header.textContent = this.model.get('title');
	}
  
  remove() {
		this.htmlEdit.destroy();
		super.remove();
	}
	
  getSource() {
		console.log('CALL EditView::getSource ');
		return this.model.getSource();
	};
  
}

EditView.prototype.className = 'sc_editwrap grid_cell-inner';
EditView.prototype.template = 
	'<div class="sc_editwrap-numspace" data-co="scale">1</div>' +
	'<div class="sc_editwrap-workspace" data-co="wrap" tabindex="1">' +
		'<pre class="sc_edit-pre" contenteditable data-co="edit"></pre>' +
	'</div>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' +
	'</div>' +
	'';

EditView.prototype.events = {
  'onkeydown': function(e){
    if(e.ctrlKey || e.metaKey){
      switch (String.fromCharCode(e.which).toLowerCase()) {
        case 's':
          e.preventDefault();
          console.warn('ctrl-s');
          // TODO trigger hotkey event
          break;
        case 'f':
          e.preventDefault();
          console.warn('ctrl-f');
          break;
        case 'g':
          e.preventDefault();
          console.warn('ctrl-g');
          break;
      }
    } else if (e.altKey) {
      if (e.keyCode == 39) { // [Alt + Right]
        this.parent.bus.trigger('focus_next_doc', this);
      } else if (e.keyCode == 82) { // [ALT + R]
        this.model.trigger('reloadMainFrame');
      } /*else{
        console.log('ALT key');	
        console.dir(e);
      }*/
    }
  },
  // use onkeyup event to observe by cursor position (need to restore previous position while navigation between documents)
  'onkeyup': function(e){
    if (!(e.altKey && e.keyCode == 39)) {
      var posData = this.htmlEdit.getSelection();
      this._lastPos = posData.end;
    }
  },
  'onclick close': function(){
    this.model.trigger('close', this.model, this);
  },
  'onscroll edit': function(e){
    this.controls.scale.scrollTop = e.target.scrollTop;
  },
  'onfocus edit': function(){
    this.model.change('focus', true);
  },
  'onblur edit': function(){
    // Safary does not allow to call getSelection() at not focused element! So it will cause an exception
    // Turn off to fix bug:
    // Try to store cursor position
    // var posData = this.htmlEdit.getSelection();
    // this._lastPos = posData.end;

    this.model.change('focus', false);
  },
};

module.exports = EditView;
