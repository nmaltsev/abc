;(function(ENV){
	//==============================
	// Key codes
	//==============================
	const KEY = {
		B: 66,
		D: 68,
		G: 71,
		L: 76,
		SLASH: 191,
	};
	//==============================
	// Debug options
	//==============================
	const DEBUG = {
		keyCodes: false,
	};

	function setSelectionRange(input, selectionStart, selectionEnd) {
		if(input.setSelectionRange){
			input.focus();
			input.setSelectionRange(selectionStart, selectionEnd);
		}else if (input.createTextRange) {
			var range = input.createTextRange();

			range.collapse(true);
			range.moveEnd('character', selectionEnd);
			range.moveStart('character', selectionStart);
			range.select();
		}
	}

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

	function createRange(element, start, end){
		var 	rng = document.createRange(),
				n, o = 0,
				tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, null);

		while(n = tw.nextNode()){
			o += n.nodeValue.length;
			
			// if(o > start){ // There were at last
			if(o >= start){
				rng.setStart(n, n.nodeValue.length + start - o);
				start = Infinity;
			}

			if(o >= end){
				rng.setEnd(n, n.nodeValue.length + end - o);
				break;
			}
		}
		return rng;
	};

	//==============================
	// TextEdit
	//==============================
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
						pos += el.textContent.length;
					};
					el = el.parentNode;
				}
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
			keydown: function(e){
				var 	key = e.keyCode;

				if(DEBUG.keyCodes){
					console.log('Key: %s', key);
					console.dir(e);	
				}
				
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
				}else if(e.ctrlKey && key == KEY.SLASH && this._hooks.CTRL_SLASH){
					e.preventDefault();
					var 	posData = this.getSelection(),
							text = this.el.textContent,
							start = posData.end - posData.size;
							end = posData.end;

					if(text.charAt(end - 1) == '\n' && start != end) end--; // if range end on \n - cut it out
					if(text.charAt(start) == '\n' && start == end) start--;

					var 	topBorder = text.lastIndexOf('\n', start),
							bottomBorder = text.indexOf('\n',end),
							fragment;

					if(topBorder == -1) topBorder = 0;
						else topBorder++;
					if(bottomBorder == -1) bottomBorder = text.length - 1;

					fragment = this._hooks.CTRL_SLASH(text.substring(topBorder, bottomBorder));
					posData.sel.removeAllRanges();
					this.setText(text.slice(0, topBorder) + fragment.text + text.slice(bottomBorder));

					if(posData.size == 0){
						posData.sel.addRange(createRange(this.el, posData.end + fragment.offset, posData.end + fragment.offset));
					}else{
						posData.sel.addRange(createRange(this.el, topBorder, topBorder + fragment.text.length));
					}
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
							setSelectionRange(this.el, pos + 1); // this.el.childNodes[0], pos
							var range = this.setCaretPos(pos + 1);
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
									lines = selectedText.split('\n').map(function(str){return str.length > 0 ? '\t' + str : str;});
									text = text.slice(0, start) + lines.join('\n') + (text.slice(pos) || '');
								}
								diff -= text.length;
								pos -= diff;

								posData.sel.removeAllRanges();
								this.setText(text);

								var range = createRange(this.el, (start > 0 ? start + 1 : 0), pos);

								posData.sel.addRange(range);
							}
						}
					}
			    }
			},
			//// Force html entities escaping after past events. First important for FF and need at Chrome sometimes.
			//// Attention: Firefox. Paste <br/> beside \n
			paste: function(e){
				// Prevent pasting HTML at document
				if(e && e.clipboardData && e.clipboardData.types && e.clipboardData.getData){
					e.stopPropagation();
					e.preventDefault();

					var 	pastedData = e.clipboardData.getData('text').replace(/\r/g, ''); // 'text/html'
							posData = this.getSelection(),
							text = this.el.textContent,
							start = posData.end - posData.size,
							end = posData.end;

					// console.group();
					// console.log('PASTE start: %s, end: %s, pastedData: %s', start, end, pastedData.length);
					// console.log(this.debug(pastedData));
					// console.dir(posData);
					// console.groupEnd();

					text = text.slice(0, start) + pastedData + text.slice(end);	
					end = start + pastedData.length;	
					posData.sel.removeAllRanges();
					this.setText(text);
					// To stay selected 
					// posData.sel.addRange(createRange(this.el, start, end));
					posData.sel.addRange(createRange(this.el, end, end));
				}
			}
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
			var		range = document.createRange();

			range.setStart(this.el.childNodes[0], pos);
			range.setEnd(this.el.childNodes[0], pos);
			range.collapse(false);
			return range;
		},
	};

	//=================================
	// HtmlEdit
	//=================================
	// @param {Object} conf
	function HtmlEdit($pre, engine, conf){
		TextEdit.call(this, $pre);
		this.engine = engine;
		this._conf = conf;
	}
	HtmlEdit.prototype = Object.create(TextEdit.prototype);
	HtmlEdit.prototype.constructor = TextEdit;
	HtmlEdit.prototype.events = Object.assign(Object.create(null), TextEdit.prototype.events)

	// DEPRICATED
	// // Create independent handlers collection
	// HtmlEdit.prototype.events = Object.create(null);
	// for(var eventName in TextEdit.prototype.events){
	// 	HtmlEdit.prototype.events[eventName] = TextEdit.prototype.events[eventName];
	// }

	HtmlEdit.prototype.events.input = function(e){
		var 	text = this.el.textContent,
				selection = this.getSelection(),
			 	caretPos = selection.end - selection.size;

		this.setText(text);
		selection.sel.removeAllRanges();
		selection.sel.addRange(this.setCaretPos(caretPos));
		// this._lastPos = selection.end;
	};
	HtmlEdit.prototype.setText = function(code){
		this.el.style.whiteSpace = 'pre';

		var replacePattern = /(\\u[a-f0-9]{4})/ig;
		// var replacePattern = /([\u0080-\u0400\u04FF-\uFFFF])/g;
		// var replacePattern = /([\u04FF-\uFFFF])/g; 
		code = code.replace(replacePattern, function(s){
			var 	c = s.charCodeAt(0).toString(16), 
					i = 4 - c.length; 

			while(i-- > 0) c = '0' + c; 
			return '\\u' + c;
		});
		
		// if(html = this.engine && this.engine.prettify){
		if(this.engine && this.engine.prettify){
			var 	html = this.engine.prettify(code),
					count = this.countParts(html, '\n');

			this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
			this.el.innerHTML = html;
		}else{
			var count = this.countParts(code, '\n');

			this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);
			this.el.textContent = code;
		}
		this._conf.onChange(code); // or this.el.textContent

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
	// TODO use createTreeWalker at setCaretPos
	HtmlEdit.prototype.setCaretPos = function(pos){
		var 	offset = pos,
				$node = this.el,
				range = document.createRange(),
				$nodes,
				i;


		while(offset > 0){
			$nodes = $node.childNodes;
			for(i = 0; i < $nodes.length; i++){
				if(offset > $nodes[i].textContent.length){
					offset -= $nodes[i].textContent.length;
				}else{
					$node = $nodes[i];
					break;
				}
			}

			if($node instanceof Text){
				break;
			}
		}

		range.setStart($node, offset);
		range.collapse(true);
		return range;
	};

	if(ENV.DPROVIDER){
		ENV.DPROVIDER.define(null, function HtmlEditor(){
			return HtmlEdit;
		});
	}else{
		ENV.HtmlEdit = HtmlEdit;	
	}
}(window));
