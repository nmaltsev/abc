;DPROVIDER.define(null, function ExtMimeMap(){
	return {
		'html':   'text/html',
		'xml':    'text/xml',
		'svg':    'text/html',
		'css':    'text/css',
		'js':     'application/javascript',
		'json':   'application/json',
		'txt':    'text/plain',
		'po':     'text/gettext',
		'md':     'text/markdown',
	};
});
//==========================================
// EditView
//==========================================
;DPROVIDER.define(['HtmlEditor', 'ExtMimeMap'], function EditView(HtmlEdit, ExtMimeMap){
	function numberFragment(n){
		var frag = document.createDocumentFragment();

		for(var i = 1, buf; i < n; i++){
			buf = document.createElement('div');
			buf.textContent = i;
			frag.appendChild(buf);
		}

		return frag;
	}

		var EditView = Backside.extend(function(conf){
		Backside.View.call(this, conf);
	}, Backside.View);

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
	EditView.prototype.initialize = function(conf){
		Backside.View.prototype.initialize.call(this, conf);

		if(conf.numerateLines){
			this.listen('change:linesCount', function(count, model){
				var prevCount = model.previous.linesCount || 0;

				if(count > prevCount){ // Scroll down
					this.controls.edit.scrollTop += 18; // TODO calculate line height
					$4.emptyNode(this.controls.scale);
					this.controls.scale.appendChild(numberFragment(count + 2));
					this.controls.scale.scrollTop = this.controls.edit.scrollTop;
				}// else if(count < model.previous.linesCount){console.log('\tscale reduce');}

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
				// Featured
				onChange: function(code){
					// this.model.set('content', code);
					this.model.change('content', code);
				}.bind(this)
			}
		);
		
		if(this.model.get('mime') == ExtMimeMap.js || this.model.get('mime') == ExtMimeMap.json){
			this.htmlEdit._hooks.ALT_B = function(fragment){
				var 	out = fragment;

				try{
					var 	data = JSON.parse(fragment);
					out = JSON.stringify(data, null, '\t');
				}catch(e){
					// TODO
					// alert(VOC.unvalid_json_data);
					out = fragment.replace(/\{|\;|\,/g, function(s){
						return s + '\n';
					}).replace(/\}/g, function(s){
						return '\n' + s;
					});
				}
				return out;
			}
		}

		if(conf.highlight && conf.highlight.commOpen){
			var 	_O = conf.highlight.commOpen, // Aka "Open"
					_C = conf.highlight.commClose, // Aka "Close"
					_OE = '\\' + _O.split('').join('\\'), // Aka "Open Escaped"
					_CE = '\\' + _C.split('').join('\\'),
					_clear1,
					_clear2;

			if(!_C){ // Commet by line
				_clear1 = new RegExp('^' + _OE, 'g');
				_clear2 = new RegExp('\n' + _OE, 'g');
				this.htmlEdit._hooks.CTRL_SLASH = function(fragment){
					if(fragment.substring(0, _O.length) == _O){
						return {
							// PREV
							// text: fragment.replace(_clear1, '').replace(_clear2, '\n'),
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

		this.listen('change:focus', function(isFocused, m){
			this.controls.header.parentNode.classList[isFocused ? 'add' : 'remove']('__active');
		});
		this.listen('change:title', function(title, m){
			this.controls.header.textContent = title;
		});
		this.listen('close', function(){
			this.el.remove();
		});
		this.listen('destroy', function(m){
			m.trigger('close', m, this);
            this._removeEventListeners();
			this.remove();
			console.log('\t[TRIG destroy model edit.view] %s', m.get('id'));
		});
		this.listen('updateContent', function(m, newContent){
			this.htmlEdit.setText(newContent);
			this.htmlEdit.setCaretPos(0);				
		});

		this._removeEventListeners = this._prebindEvents();
		this.controls.header.textContent = this.model.get('title');
	};
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
			}else if(e.altKey){
				if(e.keyCode == 39){ // [Alt + Right]
					App.bus.trigger('focus_next_doc', this);
				}else if(e.keyCode == 82){ // [ALT + R]
					this.model.trigger('reloadMainFrame');
				}/*else{
					console.log('ALT key');	
					console.dir(e);
				}*/
			}
		},
		// use onkeyup event to observe by cursor position (need to restore previous position while navigation between documents)
		'onkeyup': function(){
			var posData = this.htmlEdit.getSelection();
			this._lastPos = posData.end;
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
			// Try to store cursor position
			var posData = this.htmlEdit.getSelection();
			this._lastPos = posData.end;
			this.model.change('focus', false);
		},
	};
	EditView.prototype.remove = function(){
		this.htmlEdit.destroy();
		Backside.View.prototype.remove.call(this);
	};
	EditView.prototype.getSource = function(){
		return this.htmlEdit.el.textContent;
	};

	return EditView;
});

//==========================================
// FrameView
//==========================================
;DPROVIDER.define(null, function FrameView(){
	// @param {Backside.Model} appModel
	// @param {Backside.Model} docModel
	var FrameView = Backside.extend(function(conf){
		this.appModel = conf.appModel;
		// Inner resource cash
		this._url_resources = [];
		this._model_resources = [];
		Backside.View.call(this, conf);
	}, Backside.View);
	FrameView.prototype.className = 'sc_frame-wrap';
	FrameView.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
	FrameView.prototype.initialize = function(conf){
		Backside.View.prototype.initialize.call(this, conf);
		this.el.style.display = 'none';
		this._removeEventListeners = this._prebindEvents();
		this.listen('closePresentation', function(m){
			this.clearSubResources();
			this.appModel.closeSpace(m.getPresentationID());
			this.el.remove();
		});
		this.listen('destroy', function(m){
            this._removeEventListeners();
			this.clearSubResources();
			this.remove();
		});
		this.listen('reloadMainFrame', function(m){
			this.refresh();
		});
		// This event handler would be flushed when parent view would be removed with all child views
		this.listen('change:title', function(title, m){
			this.controls.header.textContent = title;
		});
	};
	FrameView.prototype.clearSubResources = function(){
		var 	i = this._url_resources.length;
		
		while(i-- > 0){
			this._model_resources[i].off('reloadMainFrame');
		}

		i = this._url_resources.length;
		while(i-- > 0){
			URL.revokeObjectURL(this._url_resources[i]);
		}
		this._model_resources.length = 0;
		this._url_resources.length = 0;
	}
	// Attention, read: https://developer.mozilla.org/ru/docs/Web/API/URL/createObjectURL
	// TODO  use URL.revokeObjectURL() for clearing ObjectUrl instances
	FrameView.prototype.refresh = function(){ // send reference on application
		this.clearSubResources();

		var 	source = this.model.get('content'),
				_app = this.appModel,
				_docs = _app.get('docs'),
				_self = this,
				blob,
				html;

		this.html = html = source.replace(/\"\.\/([^\"]+)\"/g, function(frag, fname){
			var 	sourceId = _app.docIDMap[fname],
					docModel = _docs[sourceId];

			if(docModel){
				// on "reload" call refresh
				docModel.on('reloadMainFrame', function(){
					_self.refresh();
				});

				var 	code = docModel.get('content'),
						blob = new Blob([code], {type: docModel.get('mime')}),
						url = URL.createObjectURL(blob);

				_self._model_resources.push(docModel);		
				_self._url_resources.push(url);
				
				return '\"' + url + '\"';
			}else{
				return sourceId;
			}
		});
		

		if(false){
			htmlBlob = new Blob([html], {type: 'text/html'});
			this.controls.frame.src = URL.createObjectURL(htmlBlob);	
		}else{ // Old school method
			if(!this.controls.frame || !this.controls.frame.contentWindow){
				console.log('DEBUG');
				console.dir(this);
			}
			// console.log('FRAME');
			// console.dir(this.controls.frame);
			var doc = this.controls.frame.contentWindow.document;
			doc.open();
			doc.write(html);
			doc.close();				
		}
		
		// console.log('DEBUG title `%s`', this.model.get('title'));
		// console.dir(this.controls.header);
		// console.dir(this)
		this.controls.header.textContent = this.model.get('title');
	};
	FrameView.prototype.events = {
		'onclick close': function(){
			this.model.trigger('closePresentation', this.model);
		},
		'onclick reload': function(){
			this.refresh();
		},
		'onload frame': function(e){
			this.controls.header.textContent = this.controls.frame.contentDocument.title
		},
		'onclick separate': function(e){
			// create independent instance of page
			var 	urlOnDoc = URL.createObjectURL(new Blob([this.html], {type: 'text/html'}));

			window.open(urlOnDoc, '_blank');
		},
	};

	return FrameView;
});
//==========================================
// JS Console (Featured)
//==========================================
;DPROVIDER.define(null, function JsConsole(){
	// @param {Backside.Model} appModel
	// @param {Backside.Model} docModel
	var JsConsole = Backside.extend(function(conf){
		this.appModel = conf.appModel;
		Backside.View.call(this, conf);
	}, Backside.View);
	JsConsole.prototype.className = 'sc_frame-wrap';
	JsConsole.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
	JsConsole.prototype.initialize = function(conf){
		Backside.View.prototype.initialize.call(this, conf);
		this.el.style.display = 'none';
		this._stopEventsListeners = this._prebindEvents();
		this.listen('closePresentation', function(m){
			this.appModel.closeSpace(m.getPresentationID());
			this.el.remove();
		});
		this.listen('destroy', function(m){
	        // TODO clear
	        this._stopEventsListeners();
	        this.remove();
			console.log('\t[TRIG destroy presentation view] %s', m.get('id'));
		});
		this.listen('reloadMainFrame', function(m){
			this.refresh();
		});
		this.listen('change:title', function(title, m){
			this.controls.header.textContent = title;
		});
		this.controls.frame.onload = function(e){
			this.updateContent(e.target.contentDocument, this.model.get('content'));
		}.bind(this);
	};
	JsConsole.prototype.refresh = function(){ // send reference on application
		var 	source = this.model.get('content');

		this.controls.frame.contentWindow.location.reload();
		this.controls.header.textContent = this.model.get('title');
	};
	JsConsole.prototype.updateContent = function(doc, source){
		doc.open()
		doc.write('<style>html{font:13px/15px Arial;color:#333;}body{margin:0;}p{margin:0 0 8px 0;}</style>');
		doc.write('<script>' + this.injectCode + '</script>');
		doc.write('<script>' + source + '</script>');
		doc.close();
	};
	JsConsole.prototype.injectCode =
`;(function(E){
	const ESCAPE_MAP = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;'
		};
	const UNESCAPE_MAP = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#x27;': "'"
	};

	const _console = E.console;

	function escape(str){
		return str ? str.replace(/[<>&"']/g, function(m){
			return ESCAPE_MAP[m];
		}) : '';
	};
	function unescape(str){
		return str.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;)/g, function(m){
			return UNESCAPE_MAP[m];
		});
	};
	E.console = {
		log: function(){
			var 	len = arguments.length,
					s = arguments[0];
			
			if(len > 1){
				for(var i = 1; i < len; i++){
					s = s.replace('%s', arguments[i]);
				}
				
			}else{
				s += '';
			}
			document.write('<p>' + s.replace(/\\n/g, '<br/>&#8203;') + '</p>');
		},
		dir: function(o){
			document.write('<p>' + JSON.stringify(o, null, '\\t') + '</p>');
		},
		clear: function(){
			document.body.innerHTML = '';
		}
	};
	E.onerror = function(e, s, line, position, error){
		console.log(escape(error.stack).replace(/\\n/g, '<br/>'));
		// _console.log('Catch error');
		// _console.dir(arguments);
		// _console.log(error.stack.replace(/\\n/g, '<br/>'));
	};
}(window));`;
	JsConsole.prototype.events = {
		'onclick close': function(){
			this.model.trigger('closePresentation', this.model);
		},
		'onclick reload': function(){
			this.refresh();
		},
		'onload frame': function(e){
			this.controls.header.textContent = this.controls.frame.contentDocument.title
		},
		'onclick separate': function(e){ // create independent instance of page
			// TODO need new code
			
			// var 	urlOnDoc = URL.createObjectURL(new Blob([this.html], {type: 'text/html'}));
			// window.open(urlOnDoc, '_blank');
		},
	};

	return JsConsole;
});
//==========================================
// Markdown Viewer (Featured)
//==========================================
;DPROVIDER.define(null, function MarkdownViewer(){
	// @param {Backside.Model} appModel
	// @param {Backside.Model} docModel
	var MarkdownViewer = Backside.extend(function(conf){
		this.appModel = conf.appModel;
		Backside.View.call(this, conf);
	}, Backside.View);
	MarkdownViewer.prototype.className = 'sc_frame-wrap';
	MarkdownViewer.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
	MarkdownViewer.prototype.initialize = function(conf){
		Backside.View.prototype.initialize.call(this, conf);
		this.el.style.display = 'none';
		this._stopEventsListeners = this._prebindEvents();
		this.listen('closePresentation', function(m){
			this.appModel.closeSpace(m.getPresentationID());
			this.el.remove();
		});
		this.listen('destroy', function(m){
	        // TODO clear
	        this._stopEventsListeners();
	        this.remove();
			console.log('\t[TRIG destroy presentation view] %s', m.get('id'));
		});
		this.listen('reloadMainFrame', function(m){
			this.refresh();
		});
		this.listen('change:title', function(title, m){
			this.controls.header.textContent = title;
		});
		this.controls.frame.onload = function(e){
			this.updateContent(e.target.contentDocument, this.model.get('content'));
		}.bind(this);
	};
	MarkdownViewer.prototype.refresh = function(){ // send reference on application
		var 	source = this.model.get('content');

		this.controls.frame.contentWindow.location.reload();
		this.controls.header.textContent = this.model.get('title');
	};
	/*
	How to handle new lines at lists:
	- abc
		aasdwdwe <- internal line
	- abc
		- xyz <-- internal list
		- axc
	- wedwe

	*/
	MarkdownViewer.prototype.updateContent = function(doc, source){
		doc.open()
		doc.write('<style>html{font:12px/16px Arial;color:#333;}body{margin:8px;}p{margin:0 0 8px 0;}pre{display:block;padding:8px;margin: 0 0 1em 0;background:#3a3c56;color:#fff;tab-size:4;}.markdown-code{padding:0 2px;background:#26a75a;color:#fff;}p{margin: 0 0 8px 0;}a{color:#1459dd;}ul{padding: 0 0 0 20px;}</style>');
		doc.write(source
			.replace( 
				// /((?:\s*\-\s+.*\n?)+)|```(.+)?\n([\s\S]*?)```|(\#+\s+?)(.+)\n|([\s\S]*?)(?:\n\s+|\#|\n\s*\-)/g, 
				/((?:\s*?\-\s+.*\n?)+)|```(.+)?\n([\s\S]*?)```|(\#+\s+?)(.+)\n/g, 
				function(substr, list_items, code_type, code, title_type, title_text){
					if(list_items){
						return '<ul>' + list_items.
							split('- ').
							map(s => s.trimLeft()).
							filter(s => s.length > 0).
							map(s => '<li>' + Backside._.escape(s.trimLeft()) + '</li>').
							join('') + 
						'</ul>';	
					}else if(code != null){
						// TODO handle code_type.trim()
						return '<pre>' + Backside._.escape(code) + '</pre>';
					}else if(title_type){
						title_type = 'h' + title_type.trim().length;
						return '<' + title_type + '>' + Backside._.escape(title_text || '') + '</' + title_type + '>';
					}/*else if(article != null){
						return '\n<p>' + (article).replace(/\s{2}\n/g, '<br/>') + '</p>\n';
					}*/
				})	
			.replace(
				/([\s\S]*?)(?:\n\s+|\#|\n\s*\-)/g,
				function(substr, article){
					if(article != null){
						return '\n<p>' + (article).replace(/\s{2}\n/g, '<br/>') + '</p>\n';
					}
				})
			.replace(
				// /\[([^\]]*)\]\(([^\)]*)\)|(\#+\s+)(.+)\n|`(.*?)`|([*]{3})|([\-]{3})|(\n)/g, 
				/\[([^\]]*)\]\(([^\)]*)\)|`(.*?)`|([*]{3})|([\-]{3})/g, 
				function(substr, hyp_text, hyp_link, inline_code, astericks, dashes/*, newLine*/){
					if(hyp_text != null){
						return '<a href="' + Backside._.escape(hyp_link || '') + '" target="_blank">' + Backside._.escape(hyp_text) + '</a>';
		            }else if (inline_code != null){
						return '<i class="markdown-code">' + Backside._.escape(inline_code) + '</i>';
					}else if(astericks != null || dashes != null){
						return '<hr/>';
					}/*else if(newLine){
						return '<br/>';
					}*/
				})
			
		);
		doc.close();
	};
	MarkdownViewer.prototype.events = {
		'onclick close': function(){
			this.model.trigger('closePresentation', this.model);
		},
		'onclick reload': function(){
			this.refresh();
		},
		'onload frame': function(e){
			this.controls.header.textContent = this.controls.frame.contentDocument.title
		},
		'onclick separate': function(e){ // create independent instance of page
			// TODO need new code
			// var 	urlOnDoc = URL.createObjectURL(new Blob([this.html], {type: 'text/html'}));
			// window.open(urlOnDoc, '_blank');
		},
	};
	return MarkdownViewer;
});
