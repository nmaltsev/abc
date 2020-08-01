const LimitedStack = require('./LimitedStack');
const { DEBUG } = require('./Configs');
const config = require('./Configs');
const KEY = require('./keycodes');
const KEY_BINDINGS = require('./HtmlEditor.keybindings');

	
function HtmlEdit($pre, engine, conf, model){
  this.el = $pre;
  this.el.contentEditable = true;
  this._handlers = Object.create(null);
  this._hooks = {};
  this.init();

  this.engine = engine;
  this._conf = conf;
  this.model = model;

  this._history = new LimitedStack();
}
HtmlEdit.prototype.key_bindings = KEY_BINDINGS;

HtmlEdit.prototype.events = {
  //// ovveride [Enter] and [TAB] keys, without firing oninput event
  keydown: function(e){
    if (DEBUG.keyCodes) {
      console.log('Key: %s', e.keyCode);
      console.dir(e);	
    }

    if (e.keyCode === KEY.ENTER || e.keyCode === KEY.TAB || e.keyCode === 46) { // Default actions on keys
      // #13 - prevent [Enter] browsers inserting <div>, <p>, or <br> on their own
      // #9 - prevent [Tab]
      // by default by [Enter] removing selection
      let		posData = this.getSelection(),
            pos = posData.end,
            text;

      if (posData.size == 0) { //// if cursor without selection
        e.preventDefault(); //// don't fire oninput event!
        text = this.el.textContent;

        if (e.keyCode == KEY.ENTER) {
          //// detect how many \t was at previous line 
          let 	prevNewLinePos = text.lastIndexOf('\n', pos - 1) + 1, //// Attention: don't fix `-1` value because position index and cursur position shifted on one item.
                tabStr = '';

          while (prevNewLinePos < pos) {
            if (text[prevNewLinePos] == '\t') {
              tabStr += '\t';
              prevNewLinePos++;
            } else {
              break;
            }
          }

          text = text.slice(0, pos) + '\n' + tabStr + (text.slice(pos) || ' ');
          pos += tabStr.length;
        } else if (e.keyCode == KEY.TAB) {
          let tab = this._getTab();
          text = text.slice(0, pos) + tab + (text.slice(pos) || ' ');

          pos += tab.length -1;
        } else if(e.keyCode == 46) { // This hook for html editor. Fix removing of empty node
          text = text.slice(0, pos) + (text.slice(pos + 1) || ' ');
          pos--;
        }

        posData.sel.removeAllRanges();
        this.setText(text);
        
        if (config.isIE11) { // FOR IE
          this.setSelectionRange(this.el, pos + 1); // this.el.childNodes[0], pos
          let range = this.setCaretPos(pos + 1);
          posData.sel.addRange(range);
        } else {
          posData.sel.addRange(this.setCaretPos(pos + 1));
        }
        
        // Disabled
        // this._history.add({
        //   text,
        //   start: pos + 1,
        //   end: pos + 1,
        // });
      } else { // Ovveride moving lines by tab
        if(e.keyCode == KEY.TAB){ // Catch TAB
          e.preventDefault(); //// don't fire oninput event!

          text = this.el.textContent;
          let start = posData.end - posData.size;
          let selectedText = text.substring(start, pos);

          if (selectedText.indexOf('\n') == -1) { // if new lines not founded just replace selected on \t
            // text = text.slice(0, start) + '\t' + (text.slice(pos) || ' ');
            // pos -= selectedText.length - 1; // less on one because we replace on single char \t
            let tab = this._getTab();
            text = text.slice(0, start) + tab + (text.slice(pos) || ' ');
            pos -= selectedText.length - tab.length; // less on one because we replace on single char \t

            posData.sel.removeAllRanges();
            this.setText(text);
            posData.sel.addRange(this.setCaretPos(pos));
          } else {
            let 	head = text.slice(0, start),
                  lastLinePos = head.lastIndexOf('\n'),
                  lines,
                  diff = text.length;

            // start position will change
            start = lastLinePos != -1 ? lastLinePos : 0;
            selectedText = text.substring(start, pos);

            if (e.shiftKey) { // move selected to left
              lines = selectedText.split('\n').map(function(str){return (str.charCodeAt(0) == 9 || str.charCodeAt(0) == 32) ? str.substring(1) : str;});
              text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
            } else { // move selected to right
              let tab = this._getTab();
              lines = selectedText.split('\n').map(function(str){return str.length > 0 ? tab + str : str;});
              text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
            }
            diff -= text.length;
            pos -= diff;

            posData.sel.removeAllRanges();
            this.setText(text);

            let range = this.createRange(this.el, (start > 0 ? start + 1 : 0), pos);

            posData.sel.addRange(range);
          }
        }
      }
    } else if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      
      // This condition must be after [TAB] handler because it ovverides lines shifting with [Shift] key
      if (KEY[e.keyCode]) {
        let 	combination = ((e.ctrlKey || e.metaKey) ? 'CTRL_' : '') + (e.shiftKey ? 'SHIFT_' : '') + (e.altKey ? 'ALT_' : '') + KEY[e.keyCode],
              handler = this.key_bindings[combination],
              posData = this.getSelection();

        if (handler) {
          e.preventDefault();
          let historyPoint = handler(this, posData);

          if (historyPoint) {
            posData.sel.removeAllRanges();
            this.setText(historyPoint.text);
            posData.sel.addRange(this.createRange(this.el, historyPoint.start, historyPoint.end));
            // this._history.add(historyPoint);
          }
        }
      }
    }
  },
  //// Force html entities escaping after past events. First important for FF and need at Chrome sometimes.
  //// Attention: Firefox. Paste <br/> beside \n
  //// Attention: clipboardData.getData() can be called only in onpaste event by security reasons
  paste: function(e){
    // Prevent pasting HTML at document
    if (!e || !e.clipboardData || !e.clipboardData.types || !e.clipboardData.getData) return;
    
    e.stopPropagation();
    e.preventDefault();

    let 	pastedData = e.clipboardData.getData('text').replace(/\r/g, ''); // Also available 'text/html'
          posData = this.getSelection(),
          text = this.el.textContent,
          start = posData.end - posData.size,
          end = posData.end;

    if (this._hooks.onpaste) {
      pastedData = this._hooks.onpaste(pastedData);						
    }

    text = text.slice(0, start) + pastedData + text.slice(end);	
    end = start + pastedData.length;	
    posData.sel.removeAllRanges();
    this.setText(text);
    // To stay selected 
    // posData.sel.addRange(createRange(this.el, start, end));
    posData.sel.addRange(this.createRange(this.el, end, end));
  },
  copy: function(e){
    if (!e || !e.clipboardData || !this._hooks.oncopy) return;

    e.stopPropagation();
    e.preventDefault();

    let 	posData = this.getSelection(),
          text = this.el.textContent,
          start = posData.end - posData.size,
          end = posData.end;

    e.clipboardData.setData('text/plain', this._hooks.oncopy(text.substring(start, end)));
  },
  input: function(e){
    const text = this.el.textContent; 
    const selection = this.getSelection();
    const caretPos = selection.end - selection.size;

    this.setText(text);
    selection.sel.removeAllRanges();
    selection.sel.addRange(this.setCaretPos(caretPos));

    setTimeout(() => {
      console.log('INPUT');
      console.dir(selection);
      // TODO add debouncing
      this._history.add({
        text,
        start: selection.end - selection.size,
        end: selection.end
      });
    }, 0);
  }
};

HtmlEdit.prototype.setText = function(text){
  this.el.textContent = text;
};
HtmlEdit.prototype.getText = function(){
  return this.el.textContent;	
};

HtmlEdit.prototype.getSelection = function(){
  var 	sel = window.getSelection(),
        range = sel.getRangeAt(0),
        preCaretRange = range.cloneRange();

  preCaretRange.selectNodeContents(this.el);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  if (config.isIE11){
    let	el = sel.anchorNode,
        pos = sel.anchorOffset;

    while (el.parentNode && el != this.el) {
      while (el.previousSibling) {
        el = el.previousSibling;
        pos += el.textContent.length;
      };
      el = el.parentNode;
    }
    return {
      end: pos,
      size: sel.toString().length, // the length of selected text
      sel: sel,
    };
  } else {
    // Attention: Start can be detected with sel.anchorNode!
    // Attention:
    // Selection size can be detected by `sel.toString().length` and `range.toString().length`. Both of them perfectly work in Chrome
    // But FF doesn't count tab chars in selections at `sel.toString().length`.
    return {
      end: preCaretRange.toString().length, // where selection ends IE11 results is differernt from Chrome (not contains \n)
      // end: preCaretRange.endOffset, // Buggi Work at IE11 and W3C, but without syntax highlighting!

      // Attention!
      // FF bug: lose all tabs inside selection! Табы не учитываются, поэтому может быть меньше реального
      // size: sel.toString().length, // selection length
      size: range.toString().length,
      sel: sel,
      range: range,
    };
  }
};

HtmlEdit.prototype.init = function(){
  var handler;

  for(key in this.events){ // bind events
    handler = this.events[key].bind(this);
    this._handlers[key] = handler;
    this.el.addEventListener(key, handler);
  }
};
HtmlEdit.prototype.debug = function(text){
  return (text || this.el.textContent).replace(/\n/g,'<N>').replace(/\r/g,'<R>').replace(/\t/g,'<T>')
};
HtmlEdit.prototype._getBordersOfContextLine = function(posData, text){
  var 	out = {};

  if(posData.size == 0){ // Get current line
    let borders = this.findLineBorders(text, posData.end);

    out.start = borders.start;
    out.end = borders.end;
  }else{ // get selection
    out.start = posData.end - posData.size;
    out.end = posData.end;
  }
  out.fragment = text.substring(out.start, out.end);

  return out;
};
HtmlEdit.prototype._getTab = function(){
  // TODO set configurable tabSize!
  return true ? '\t' : ' '.repeat(4);
};
HtmlEdit.prototype.destroy = function(){
  var handler;

  for(key in this._handlers){ // unbind events
    handler = this._handlers[key];
    this.el.removeEventListener(key, handler);
  }
  this._handlers = Object.create(null);
};
HtmlEdit.prototype.setCursor = function(pos){
  var sel = window.getSelection();

  sel.removeAllRanges();
  sel.addRange(this.setCaretPos(pos));
};

HtmlEdit.prototype.createRange = function(element, start, end){
  var 	rng = document.createRange(),
        n, o = 0,
        tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, null);

  while(n = tw.nextNode()){
    o += n.nodeValue.length;
     
    if (o >= start) {
      rng.setStart(n, n.nodeValue.length + start - o);
      start = Infinity;
    }

    if (o >= end) {
      rng.setEnd(n, n.nodeValue.length + end - o);
      break;
    }
  }
  return rng;
};
HtmlEdit.prototype.setSelectionRange = function(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  } else if (input.createTextRange) {
    let range = input.createTextRange();

    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
};
HtmlEdit.prototype.findLineBorders = function(text, pos){
  var out = {
    start: text.lastIndexOf('\n', pos - 1),
    end: text.indexOf('\n', pos)
  };
  
  if (!~out.start) { // not found
    out.start = 0;
  } else {
    out.start++;
  }

  if (!~out.end) {
    out.end = text.length; // not found	
  } else {
    out.end++;
  }

  return out;
};

/*
 Solutions:
  // var replacePattern = /([\u0080-\u0400\u04FF-\uFFFF])/g;
  // var replacePattern = /([\u04FF-\uFFFF])/g; 
  code = code.replace(replacePattern, function(s){
    var 	c = s.charCodeAt(0).toString(32), 
          i = 4 - c.length; 

    while(i-- > 0){
      c = '0' + c; 	
    } 
    return '\\u' + c;
  });

*/
HtmlEdit.prototype.setText = function(code){
  this.el.style.whiteSpace = 'pre';

  var 	replacePattern = /(\\u[a-f0-9]{4})/ig,
        count;
  //  To research. Correct paste '\u0410-\u044f' at chrome
  code = code.replace(replacePattern, function(s){
    return '\\u' + s.substring(2);
  });

  if (this.engine && this.engine.prettify) {
    let 	html = this.engine.prettify(code);
    
    count = this.countParts(html, '\n');
    this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
    this.el.innerHTML = html;
  } else {
    count = this.countParts(code, '\n');
    this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
    this.el.textContent = code;
  }
  this._conf.onChange(code);

  return 0;
};
HtmlEdit.prototype.countParts = function(text, subText){
  var 	pos = -2,
        count = -1;

  while(pos != -1){
    pos = text.indexOf(subText, pos + 1);
    count++;
  }
  return count;
};
// TODO use createTreeWalker in the code
// HtmlEdit.prototype.setCaretPos = function(pos){
// 	var 	offset = pos,
// 			$node = this.el,
// 			range = document.createRange(),
// 			$nodes,
// 			i;

// 	while(offset > 0){
// 		$nodes = $node.childNodes;
// 		for(i = 0; i < $nodes.length; i++){
// 			if(offset > $nodes[i].textContent.length){
// 				offset -= $nodes[i].textContent.length;
// 			}else{
// 				$node = $nodes[i];
// 				break;
// 			}
// 		}

// 		if($node instanceof Text){
// 			break;
// 		}
// 	}

// 	range.setStart($node, offset);
// 	range.collapse(true);
// 	return range;
// };
HtmlEdit.prototype.setCaretPos = function(pos){
  var range = this.createRange(this.el, pos, pos);

  range.collapse(true);
  return range;
};

// @param {HtmlElement} node
// @return {Number} pos
HtmlEdit.prototype.getElementPos = function(node){
  let pos = 0;
  let n;
  let symbolstack = [];
  
  if (node.previousSibling) {
    n = node.previousSibling;
    pos = 0;
  } else {
    n = node.parentNode;
  }

  while (n != this.el && n.parentNode) {
    while (n.previousSibling){
      pos += n.textContent.length;
      symbolstack.push(n.textContent);
      n = n.previousSibling;
    }
    pos += n.textContent.length;
    symbolstack.push(n.textContent);
    n = n.parentNode;
  }

  return pos;
};

HtmlEdit.prototype.resetCode = function(code, selectionStartPos, selectionEndPos){
  var sel = window.getSelection();

  sel.removeAllRanges();
  this.setText(code);
  sel.addRange(this.createRange(this.el, selectionStartPos, selectionEndPos));
  this._history.add({
    text: code,
    start: selectionStart,
    end: selectionEnd
  });
};

module.exports = HtmlEdit;
