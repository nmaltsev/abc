function numberFragment(n){
	var frag = document.createDocumentFragment();

	for(var i = 1, buf; i < n; i++){
		buf = document.createElement('div');
		buf.textContent = i;
		frag.appendChild(buf);
	}

	return frag;
}

//==========================================
// EditView
//==========================================
{
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

		this.htmlEdit = new HtmlEdit(
			this.controls.edit, 
			conf.highlight, 
			{
				onLinesCountUpdate: function(count){
					this.model.change('linesCount', count);
				}.bind(this)
			}
		);
		
		if(this.model.get('mime') == ExtMimeMap.js || this.model.get('mime') ==ExtMimeMap.json){
			this.htmlEdit._hooks.ALT_B = function(fragment){
				var 	out = fragment;

				try{
					var 	data = JSON.parse(fragment);
					out = JSON.stringify(data, null, '\t');
				}catch(e){
					// alert(VOC.unvalid_json_data);
				}
				return out;
			}
		}

		this.listen('change:focus', function(isFocused, m){
			this.controls.header.parentNode.classList[isFocused ? 'add' : 'remove']('__active');
		});
		this.listen('close', function(){
			this.el.remove();
		});
		this.listen('destroy', function(m){
			m.trigger('close', m, this);
			this.remove();
			// console.log('\t[TRIG destroy model edit.view] %s', m.get('id'));
		});
		this.listen('updateContent', function(m, newContent){
			this.htmlEdit.setText(newContent);
			this.htmlEdit.setCaretPos(0);				
		});

		this._prebindEvents();
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
				}
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
		'oninput edit': function(){
			this.model.set('content', this.htmlEdit.el.textContent);
		}
	};
		
	EditView.prototype._prebindEvents = function(conf){
		var 	events = conf || this.events,
				control, eventName, pos;

		for(key in events){
			pos = key.indexOf(' ');

			if(~pos){
				eventName = key.substr(0, pos++);
				control = this.controls[key.substr(pos)];
			}else{
				eventName = key;
				control = this.el;
			}
			if(control){
				control[eventName] = events[key].bind(this);
			}
		}
	};
	EditView.prototype.remove = function(){
		this.htmlEdit.destroy();
		Backside.View.prototype.remove.call(this);
	};
	EditView.prototype.getSource = function(){
		return this.htmlEdit.el.textContent;
	};
}
//==========================================
// FrameView
//==========================================
{
	// @param {Backside.Model} appModel
	// @param {Backside.Model} docModel
	var FrameView = Backside.extend(function(conf){
		this.appModel = conf.appModel;
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
		this._prebindEvents();
		this.listen('closePresentation', function(m){
			this.appModel.closeSpace(m.getPresentationID());
			this.el.remove();
		});
		this.listen('destroy', function(m){
			this.remove();
			// console.log('\t[TRIG destroy presentation view] %s', m.get('id'));
		});
	};
	// Attention, read: https://developer.mozilla.org/ru/docs/Web/API/URL/createObjectURL
	// TODO  use URL.revokeObjectURL() for clearing ObjectUrl instances
	FrameView.prototype.refresh = function(){ // send reference on application
		var 	source = this.model.get('content'),
				_app = this.appModel,
				_docs = _app.get('docs'),
				blob,
				html;

		this.html = html = source.replace(/\"\.\/([^\"]+)\"/g, function(frag, fname){
			var 	sourceId = _app.docIDMap[fname],
					docModel = _docs[sourceId];

			if(docModel){
				var 	code = docModel.get('content'),
						blob = new Blob([code], {type: docModel.get('mime')});

				var url = URL.createObjectURL(blob);
				return "\"" + url + "\"";
			}else{
				return sourceId;
			}
		});
		

		if(false){
			htmlBlob = new Blob([html], {type: 'text/html'});
			this.controls.frame.src = URL.createObjectURL(htmlBlob);	
		}else{ // Old school method
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
	// TODO this method is copy pasted!!!
	FrameView.prototype._prebindEvents = function(conf){
		var 	events = conf || this.events,
				control, eventName, pos;

		for(key in events){
			pos = key.indexOf(' ');

			if(~pos){
				eventName = key.substr(0, pos++);
				control = this.controls[key.substr(pos)];
			}else{
				eventName = key;
				control = this.el;
			}
			if(control){
				control[eventName] = events[key].bind(this);
			}
		}
	};
}

