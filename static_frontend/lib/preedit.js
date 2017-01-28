var KEY = {
	B: 66,
	D: 68,
	G: 71,
	L: 76,
};

// @argument {HtmlElemnt} $pre - <pre></pre>
function TextEdit($pre, hooks){ 
	this.el = $pre;
	this.el.contentEditable = true;
	this.__ffPasteHook = false;
	this._handlers = Object.create(null);
	this._hooks = {};
	this.init();
}
TextEdit.prototype = {
	_isFirefox: typeof(InstallTrigger) !== 'undefined',
	_isIE11: !!window.MSInputMethodContext && !!document.documentMode, // Not work at IE11
	setText: function(text){
		this.el.textContent = text;
	},
	getSelection: function(){
		var 	sel = window.getSelection(),
				range = sel.getRangeAt(0),
				preCaretRange = range.cloneRange();

		preCaretRange.selectNodeContents(this.el);
		preCaretRange.setEnd(range.endContainer, range.endOffset);

		if(false &&  this._isIE11){
			console.log('Range:');
			console.dir(range);
			console.dir(preCaretRange);
			console.log('EndOffset: %s', range.endContainer.textContent.length);
			console.dir(range.endContainer)
			console.log('caretRange: %s %s %s', preCaretRange.toString().length, preCaretRange.endOffset, this.debug(preCaretRange.toString()));	// Diff IE from Chrome (not contains \n)
		}

		if(this._isIE11){
			// [Relevant code]
			var 	el = sel.anchorNode,
					pos = sel.anchorOffset;

			while(el.parentNode && el != this.el){
				while(el.previousSibling){
					el = el.previousSibling;
					// console.log('\t\tPREV %s, %s', el.textContent.replace('\n', '\\n'), el.constructor.name);
					pos += el.textContent.length;
				};
				// console.log('Get parent');
				// console.dir(el);
				el = el.parentNode;
			}
			// console.log('Calculate pos: %s', pos);	
			return {
				end: pos,
				size: sel.toString().length, // selection length
				sel: sel,
			};
		}else{
			return {
				// Last stable code
				end: preCaretRange.toString().length, // where selection ends IE11 results is differernt from Chrome (not contains \n)
				// end: preCaretRange.endOffset, // Buggi Work at IE11 and W3C, but without syntax highlighting!
				size: sel.toString().length, // selection length
				sel: sel,
			};
		}
	},
	init: function(){
		var handler;

		for(key in this.events){ // bind events
			handler = this.events[key].bind(this);
			this._handlers[key] = handler;
			this.el.addEventListener(key, handler);
		}
	},
	debug: function(text){
		return (text || this.el.textContent).replace(/\n/g,'<N>').replace(/\r/g,'<R>').replace(/\t/g,'<T>')
	},
	events: {
		//// ovveride [Enter] and [TAB] keys, without firing oninput event
		'keydown': function(e){
			var 	key = e.keyCode;

			// console.log('Key: %s', key);
			// console.dir(e);

			
			if(key == KEY.D && e.shiftKey && e.ctrlKey){ // [Ctrl + Shift + D]
				e.preventDefault();
				// Attention set cursor at same position as before inserting!
				var 	posData = this.getSelection(),
						text = this.el.textContent,
						start, end, fragment;

				if(posData.size == 0){ // copy line
					// var borders = findLineBorders(text, posData.end);
					var borders = findLineBorders(text, posData.end);
					start = borders.start;
					end = borders.end;
					fragment = text.substring(start, end);

					text = text.slice(0, start) + fragment + fragment + (text.slice(end) || '');		
					start = end = posData.end + fragment.length;
					// DEPRICATED
					// posData.sel.removeAllRanges();
					// this.setText(text);
					// posData.sel.addRange(this.setCaretPos(posData.end + fragment.length));
				}else{ // copy selection
					start = posData.end - posData.size;
					end = posData.end;
					fragment = text.substring(start, end);
					text = text.slice(0, end) + fragment + (text.slice(end) || '');	
					start = posData.end;
					end = posData.end + posData.size;
					// DEPRICATED
					// posData.sel.removeAllRanges();
					// this.setText(text);
					// posData.sel.addRange(createRange(this.el, posData.end, posData.end + posData.size));
				}
				posData.sel.removeAllRanges();
				this.setText(text);
				posData.sel.addRange(createRange(this.el, start, end));
			}else if(e.altKey && (
				key == KEY.L || key == KEY.G || key == KEY.B
			)){
				e.preventDefault();
				var 	posData = this.getSelection(),
						text = this.el.textContent,
						start, end, fragment;

				if(posData.size == 0){ 
					// var borders = findLineBorders2(text, posData.end);
					var borders = findLineBorders(text, posData.end);

					start = borders.start;
					end = borders.end;
				}else{
					start = posData.end - posData.size;
					end = posData.end;
				}
				fragment = text.substring(start, end);

				if(key == KEY.L){
					fragment = fragment.toLowerCase();				
				}else if(key == KEY.G){
					fragment = fragment.toUpperCase();
				}else if(key == KEY.B && this._hooks.ALT_B){
					fragment = this._hooks.ALT_B(fragment);
				}
				text = text.slice(0, start) + fragment + (text.slice(end) || '');

				posData.sel.removeAllRanges();
				this.setText(text);
				posData.sel.addRange(createRange(this.el, start, start + fragment.length));
			}
			// #13 - prevent [Enter] browsers inserting <div>, <p>, or <br> on their own
			// #9 - prevent [Tab]
			// by default by [Enter] removing selection
		    if(key === 13 || key === 9 || key === 46){
		    	var 	posData = this.getSelection(),
		    			pos = posData.end,
		    			text, range;

		    	if(this._isIE11){
		    		console.log('[Enter catch] pos: %s key: %s ', pos, key);
		    		console.dir(posData);	
		    	}

		    	if(posData.size == 0){ //// if cursor without selection
		    		e.preventDefault(); //// don't fire oninput event!
		    		// e.returnValue = false;
		    		text = this.el.textContent;

		    		// var 	head = text.slice(0, pos),
		    		// 		lineFix = fixNewLines(head, ' '); // \u200b &#8203; -zero width space

					if(key === 13){
						//// detect how many \t was at previous line 
						var 	prevNewLinePos = text.lastIndexOf('\n', pos-1) + 1, //// Attention: don't fix `-1` value because position index and cursur position shifted on one item.
								tabStr = '';

						// console.log('|%s| prevNewLinePos: %s', this.debug(text.substring(prevNewLinePos, pos)), prevNewLinePos);

						while(prevNewLinePos < pos){
							if(text[prevNewLinePos] == '\t'){
								tabStr += '\t';
								prevNewLinePos++;
							}else{
								break;
							}
						}

						text = text.slice(0, pos) + '\n' + tabStr + (text.slice(pos) || ' ');
						pos += tabStr.length;
					}else if(key === 9){
						text = text.slice(0, pos) + '\t' + (text.slice(pos) || ' ');
					}else if(key === 46){ // This hook for html editor. Fix removing of empty node
						text = text.slice(0, pos) + (text.slice(pos + 1) || ' ');
						pos--;
					}

					posData.sel.removeAllRanges();
					this.setText(text);
					
					if(this._isIE11){ // FOR IE
						// console.log('setPos to: %s', pos + 1);
						setSelectionRange(this.el, pos + 1); // this.el.childNodes[0], pos
						var range = this.setCaretPos(pos + 1);
						// console.dir(range);
						posData.sel.addRange(range);
					}else{
						posData.sel.addRange(this.setCaretPos(pos + 1));
					}

		    	}else{ // else TODO ovveride moving lines by tab
					if(key == 9){ // Catch TAB
						e.preventDefault(); //// don't fire oninput event!
						text = this.el.textContent;
						var start = posData.end - posData.size;
						var selectedText = text.substring(start, pos);

						if(selectedText.indexOf('\n') == -1){ // if new lines not founded just replace selected on \t
							text = text.slice(0, start) + '\t' + (text.slice(pos) || ' ');
							pos -= selectedText.length - 1; // less on one because we replace on single char \t

							posData.sel.removeAllRanges();
							this.setText(text);
							posData.sel.addRange(this.setCaretPos(pos));
						}else{
							var 	head = text.slice(0, start),
									lastLinePos = head.lastIndexOf('\n'),
									lines,
									diff = text.length;

							// start position will change
							start = lastLinePos != -1 ? lastLinePos : 0;
							selectedText = text.substring(start, pos);

							if(e.shiftKey){ // move selected to left
								// lines = selectedText.split('\n').map(str => (str.charCodeAt(0) == 9 || str.charCodeAt(0) == 32) ? str.substring(1) : str);
								lines = selectedText.split('\n').map(function(str){return (str.charCodeAt(0) == 9 || str.charCodeAt(0) == 32) ? str.substring(1) : str;});
								text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
								// pos -= lines.length; // count all new tabs for offset	
							}else{ // move selected to right
								// lines = selectedText.split('\n').map(str => str.length > 0 ? '\t' + str : str);
								lines = selectedText.split('\n').map(function(str){return str.length > 0 ? '\t' + str : str;});
								text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
								// pos += lines.length; // count all new tabs for offset
							}
							diff -= text.length;
							pos -= diff;

							// console.log('LINES lastLinePos: %s; diff: %s', lastLinePos, diff);
							// console.dir(lines);
							
							posData.sel.removeAllRanges();
							this.setText(text);

							var range = createRange(this.el, (start > 0 ? start + 1 : 0), pos);

							posData.sel.addRange(range);
						}
					}
				}
		    }
		},
	},
	destroy: function(){
		var handler;

		for(key in this._handlers){ // unbind events
			handler = this._handlers[key];
			this.el.removeEventListener(key, handler);
		}
		this._handlers = Object.create(null);
	},
	setCursor: function(pos){
		var sel = window.getSelection();

		sel.removeAllRanges();
		sel.addRange(this.setCaretPos(pos));
	},
	setCaretPos: function(pos){
		// console.log('SetCaretPos: %s', pos);

		var		range = document.createRange();

		range.setStart(this.el.childNodes[0], pos);
		range.setEnd(this.el.childNodes[0], pos);
		range.collapse(false);

		// console.log('SetCaretPos: %s', pos);
		// console.dir(range);
		return range;
	},
};

function setSelectionRange(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  }
  else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

// text posData.end
function findLineBorders(text, pos){
	var out = {
		start: text.lastIndexOf('\n', pos - 1),
		end: text.indexOf('\n', pos)
	};
	if(!~out.start){ // not found
		out.start = 0;
	}else{
		out.start++;
	}
	if(!~out.end){
	 	out.end = text.length; // not found	
	}else{
		out.end++;
	}

	return out;
}

function findLineBorders2(text, pos){
	var out = {
		start: text.lastIndexOf('\n', pos - 1),
		end: text.indexOf('\n', pos)
	};
	if(!~out.start){ // not found
		out.start = 0;
	}else{
		out.start++;
	} 
	if(!~out.end){ // not found	
		out.end = text.length	
	}

	return out;
}

//// Force html entities escaping after past events. First important for FF and need at Chrome sometimes.
//// Thanks a lot to firefox. Paste <br/> beside \n
TextEdit.prototype.events.paste = function(e){
	this.__ffPasteHook = true; 
};
// CHANGE '\n\n\n' -> '\n[CHAR]\n[CHAR]\n'
function fixNewLines(s, char){
	var p, out = '', prev = 0, diff, count = 0;

	while(p != -1){
		p = s.indexOf('\n', prev + 1);
		
		if(p != -1){
			diff = p - prev;
			
			if(diff != 1){
				out += s.substring(prev, p)
			}else{
				out += '\n' + char; 
				count++;
			}
			// console.log('prev: %s, pos: %s', prev, p);
			prev = p;
		}else{
			out += s.substring(prev);
		}
		
	}
	return {
		str: out,
		count: count
	};
}

//=================================
// HtmlEdit
//=================================
{
	// @param {Object} conf
	function HtmlEdit($pre, engine, conf){
		TextEdit.call(this, $pre);
		this.engine = engine;
		this._conf = conf;
	}
	HtmlEdit.prototype = Object.create(TextEdit.prototype);
	HtmlEdit.prototype.constructor = TextEdit;
	// Create independent handlers collection
	HtmlEdit.prototype.events = Object.create(null);
	for(var eventName in TextEdit.prototype.events){
		HtmlEdit.prototype.events[eventName] = TextEdit.prototype.events[eventName];
	}
	HtmlEdit.prototype.events.input = function(e){
		var 	text = this.el.textContent,
				selection = this.getSelection(),
			 	caretPos = selection.end - selection.size;

		if(this.__ffPasteHook){
			// console.log('Pastehook');
			this.__ffPasteHook = false;
			text = Backside._.unescape(this.el.innerHTML.replace(/\<br\/?\>/g, '\n').replace(/\<[^\>]*\>/g, ''));
		}

		this.setText(text);
		selection.sel.removeAllRanges();
		selection.sel.addRange(this.setCaretPos(caretPos));
		// this._lastPos = selection.end;
	};
	HtmlEdit.prototype.setText = function(code){
		this.el.style.whiteSpace = 'pre';

		code = code.replace(/(\\u[a-f0-9]{4})/ig, function(s){
			var 	c = s.charCodeAt(0).toString(16), 
					i = 4 - c.length; 

			while(i-- > 0) c = '0' + c; 
			return '\\u' + c;
		});

		if(html = this.engine && this.engine.prettify){
			var 	html = this.engine.prettify(code),
					count = this.countParts(html, '\n');

			this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
			this.el.innerHTML = html;
		}else{
			var count = this.countParts(code, '\n');

			this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
			this.el.textContent = code;
		}
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
	HtmlEdit.prototype.setCaretPos = function(pos){
		var 	offset = pos,
				$node = this.el,
				range = document.createRange(),
				$nodes,
				i;


		while(offset > 0){
			// console.log('Loop %s', offset);
			// console.dir($node);

			$nodes = $node.childNodes;
			for(i = 0; i < $nodes.length; i++){
				// console.dir($nodes[i]);
				if(offset > $nodes[i].textContent.length){
					offset -= $nodes[i].textContent.length;
				}else{
					$node = $nodes[i];
					// console.log('\tstop on: `%s`', $node.textContent.replace(/\n/g, '\\n'));
					break;
				}
			}
			// console.log('\tfor end: `%s` constr: %s, offset', $node.textContent.replace(/\n/g, '\\n'), $node.constructor.name, offset);

			if($node instanceof Text){
				// console.log('\ttext: %s', $node.textContent.replace(/\n/g, '\\n'));
				break;
			}
		}

		// DEPRICATED
		/*if(this._isFirefox){
			if($node.textContent == '\n'){
				if($node.nextElementSibling){
					// Thanks alot to Mozilla: Can set cursor at empty node. So i paste invisible symbol.
					$node.nextElementSibling.textContent = '=';
					$node = $node.nextElementSibling;
					offset = 0;
				}
			}
		}*/

		range.setStart($node, offset);
		range.collapse(true);
		return range;
	};
/*
	// TODO use createTreeWalker at setCaretPos
	

	var setCaret = function(element, index) {
	    setSelectionRange(element, index, index);
	};
*/
}

function createRange(element, start, end){
	var 	rng = document.createRange(),
			// sel = getSelection(),
			n, o = 0,
			tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, null);

	while(n = tw.nextNode()){
		o += n.nodeValue.length;
		
		if(o > start){
			rng.setStart(n, n.nodeValue.length + start - o);
			start = Infinity;
		}

		if(o >= end){
			rng.setEnd(n, n.nodeValue.length + end - o);
			break;
		}
	}
	return rng;
	// sel.removeAllRanges();
	// sel.addRange(rng);
};