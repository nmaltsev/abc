// Editor with syntax highlighting v120 2017/01/28
var VER = 120;

var VOC = {
	create_new_document: 'Create new document',
	file_name: 'Document name:',
	highlighting_type: 'Syntax Highlight:',
	create: 'Create',
	none_syntax_type: 'None',
	load_page_btn: 'Run',
	remove_document: 'Remove document',
	download_document: 'Download document',
	import_from_file: 'Import content from file',
	ok: 'Ok',
	aboutApp: 'About ABC v 0.3.%d',
	unvalid_json_data: 'Unvalid json data',
	close: 'Close',
	start_test_prj: 'Start test project',
	start_default_prj: 'Start default project',
};

function downloadFileFromText(filename, content) {
	var 	a = document.createElement('a'),
			blob = new Blob([content], {type : "text/plain;charset=UTF-8"});

	a.href = window.URL.createObjectURL(blob);
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	delete a;
}

//==========================================
// MainView
//==========================================
{
	var MIME_TYPES = {
		'css': 'text/css',
		'js': 'text/js',
		'html': 'text/html'
	};

	var MainView = Backside.extend(function(conf){
		this.subView = Object.create(null);
		this.bus = new Backside.Events();
		this.listItems = {};
		Backside.View.call(this, conf);
	}, Backside.View);
	MainView.prototype.initialize = function(conf){
		Backside.View.prototype.initialize.call(this, conf);
		this._prebindEvents();

		if(!this.model) return;


		this.listen('change:gridScheme', function(code){
			this.controls.space1.style.display = (code & SPACE1) ? '' : 'none';
			this.controls.space2.style.display = (code & SPACE2) ? '' : 'none';
			this.controls.space3.style.display = (code & SPACE3) ? '' : 'none';
			this.controls.space4.style.display = (code & SPACE4) ? '' : 'none';

			if(code & SPACE2 || code & SPACE4){
				this.controls.half2.style.display = '';
			}else{
				this.controls.half2.style.display = 'none';
			}

			if(code & HORIZONTAL){
				this.controls.grid.style.flexDirection = 'column';
				this.controls.half1.style.flexDirection = 'row';
				this.controls.half2.style.flexDirection = 'row';
			}else{
				this.controls.grid.style.flexDirection = 'row';
				this.controls.half1.style.flexDirection = 'column';
				this.controls.half2.style.flexDirection = 'column';
			}
		});
		this.listen('change:current_doc', function(id){
			if(id != undefined && this.subView[id]){
				this.openTab(id);

				var editView = this.subView[id];

				// Focus if view contains editor 
				editView.htmlEdit && editView.htmlEdit.el.focus();
			}
		});
		this.listen('change:theme', function(themeId){
			var 	className = 'sc_layout-right grid_column';
			
			if(themeId == 'dark'){
				className += ' theme-dark';
			}else if(themeId == 'theme-a'){ 
				className += ' theme-a';
			}else if(themeId == 'theme-b'){ 
				className += ' theme-b';
			}else if(themeId == 'theme-c'){ 
				className += ' theme-c';
			}

			this.controls.grid.className = className;
		});
		this.listen('change:grid_id', function(gridId){
			this.changeGrid(gridId);
		});
		this.listen('change:opened_ids', function(openedIds){
			// console.log('[CHANGE change:opened_ids %s]', JSON.stringify(openedIds));
			for(var i = 0; i < openedIds.length; i++){
				// console.log('LOOP %s', openedIds[i]);
				openedIds[i] !== null && this.openTab(openedIds[i], 1 << i); // 1<<0 == 1, 1<<1 == 2 
			}
		});
		this.listen('destroy', function(){
			$4.emptyNode(this.controls.items);
			var 	id,
					docs = this.model.get('docs');

			
			for(id in docs){
				docs[id].destroy();
			}
			for(id in this.subView){
				this.subView[id] && this.subView[id].remove();
			}
		});
		// Attention: Quick and dirty method find next available document by <pre> node at DOM
		App.bus.on('focus_next_doc', function(v){
			var 	openedDocs = this.model.get('opened_ids');
			var 	pos = openedDocs.indexOf(v.model.get('id')),
					checkList = Array.prototype.concat.call(openedDocs.slice(pos + 1), openedDocs.slice(0, pos)),
					subView;

			for(var i = 0 ; i < checkList.length; i++){
				if(subView = this.subView[checkList[i]]){
					if(subView.htmlEdit){
						subView.htmlEdit.el.focus();
						subView.htmlEdit.setCursor(subView._lastPos);
						break;
					}
				}
			}
		}.bind(this));
		
		// Apply model data
		this.changeGrid(this.model.get('grid_id'));
		this.listen('add', function(documentModel, projectModel){
			this.appendDocument(documentModel);
		});

		var  	docs = this.model.get('docs'),
			 	openedIds = this.model.get('opened_ids'),
				currentDoc = this.model.get('current_doc');

		for(var id in docs){
			this.appendDocument(docs[id], true);	
		}
		this.model.change('opened_ids', openedIds);
		this.model.change('current_doc', currentDoc);
		this.controls.projectTitle.value = this.model.get('title');

		CtxMenu2({
			label: this.controls.toppanelMenuLabel,
			menu: this.controls.toppanelMenuList,
			active_cls: '__active',
		});
	};
	var ExtMimeMap = {
		'html': 'text/html',
		'xml': 'text/xml',
		'svg': 'text/html',
		'css': 'text/css',
		'js': 'application/javascript',
		'json': 'application/json',
		'txt': 'text/plain',
		'po': 'text/gettext',
	};
	MainView.prototype.events = {
		'onclick items': function(e){
			var 	$tab = $4.closest(e.target, '.sc_nav-tab'),
					role = e.target.dataset && e.target.dataset.role;

			if($tab){
				var 	doc = this.model.get('docs')[$tab.dataset.id];	
				//=========================================
				// TODO refactor opening document
				// SET focus on new document not add class Here!
				//=========================================

				if(role == 'compile-btn'){
					this.model.change('current_doc', doc.getPresentationID());
				}else if(role == 'actions-btn'){
					e.stopPropagation();
					// console.log('ACT btn');
					// console.dir([e.target]);
					// console.dir(doc);

					CtxMenu({
						target: e.target,
						onclick: function(role){
							if(role == 'remove-document'){
								// Attention: Removing trigger destroy and close events
								doc.destroy();
							}else if(role == 'download-document'){
								downloadFileFromText(doc.get('title'), doc.get('content'));
							}
						}.bind(this)
					});
				}else{
					this.model.change('current_doc', $tab.dataset.id);
				}
			}
		},
		'onclick toolsAddBtn': function(){ // Add new document
			var 	_model = this.model,
					_view = this; // _view._focusStartHook

			new $UI.BasePopupView({
				title: VOC.create_new_document,
				className: 'ppp_base',
				content: 
				'<form data-co="form" class="sc_crdoc-popup">' +
					'<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
					'<table class="sc_grid-type-a">' +
						'<tr>' +
							'<td>' + VOC.file_name + '</td>' +
							'<td>' +
								'<input class="sc_input" type="text" data-co="fname" required/>' +
							'</td>' +
						'</tr>' +
						'<tr>' + 
							'<td>' + VOC.highlighting_type + '</td>' +
							'<td>' +
							 	'<select class="sc_input" data-co="type">' +
							 		'<option value="txt">' + VOC.none_syntax_type + '</option>' +
							 		'<option value="html">HTML</option>' +
							 		'<option value="xml">XML</option>' +
							 		'<option value="svg">SVG</option>' +
							 		'<option value="css">CSS</option>' +
							 		'<option value="js">JS</option>' +
							 		'<option value="json">JSON</option>' +
							 		'<option value="po">PO (gettext)</option>' +
							 	'</select>' +
							'</td>' +
						'</tr>' +
						'<tr>' +
							'<td>&nbsp;</td>' +
							'<td>' +
								'<label><input type="file" data-co="import-from-file" class="sc_invisible"/><span class="sc_virtual-link __default">' + VOC.import_from_file + '</span></label>' +
							'</td>' +
						'</tr>' +
					'</table>' +
					'<button class="dwc_btn" type="submit" data-co="submit-btn">' + VOC.create + '</button>' +
				'</form>',
				onopen: function(view){
					view._content = '';
					setTimeout(function(){
						this.controls.fname.focus();
					}.bind(this), 100);
				},
				onclose: function(view){
					view._content = null;
				},
				popupEvents: {
					'form submit': function(e){
						e.preventDefault();
						this.close();
						_model._add(new DocumentModel({
							id: _model.get('docs').length,
							title: this.controls.fname.value,
							mime: ExtMimeMap[this.controls.type.value] || 'text/plain',
							content: this.content,
						}));
					},
					'close click': function(e){
						e.stopPropagation();
						this.close();
					},
					'fname input': function(e){
						var 	val = e.target.value,
							 	dotPos = val.lastIndexOf('.'),
								ext = dotPos != -1 && val.substr(dotPos + 1).toLowerCase();

						this.controls.type.value =  ExtMimeMap.hasOwnProperty(ext) ? ext : 'txt';
					},
					'importFromFile change': function(e){
						var 	file = e.target.files[0],
								type = 'text/plain';

						switch(file.type){
							case 'image/svg+xml': type = 'svg'; break;
							case 'text/xml': type = 'xml'; break;
							case 'text/html': type ='html'; break;
							case 'text/css': type ='css'; break;
							case 'application/javascript': type ='js'; break;
							default: 
								if(/\.json/i.test(file.name)) type = 'json';
								break;
						}

						this.controls.type.value = type;
						this.controls.fname.value = file.name;
						
						if(file){
							var fr = new FileReader();

							// Lock form while file is reading
							this.controls.submitBtn.disabled = true;

							fr.onload = function(e){      
								this.controls.submitBtn.disabled = false;
								this.content = e.target.result;
							}.bind(this);
							fr.onerror = function(e){
								console.log('File reader error');
								console.dir(e);
							};
			    			fr.readAsText(file);
			    			e.target.value = ''; // reset input
						}
					},
				},
			}).open();
		},
		'onchange selectGrid': function(e){
			this.model.change('grid_id', e.target.value);
		},
		'onchange selectTheme': function(e){
			var theme = 'light';
			switch(e.target.value){
				case 'dark': theme = 'dark'; break;
				case 'theme-a': theme = 'theme-a'; break;
				case 'theme-b': theme = 'theme-b'; break;
				case 'theme-c': theme = 'theme-c'; break;
			}
			this.model.change('theme', theme);
		},
		'onchange importProject': function(e){
			var file = e.target.files[0];

			if(file){
				var fr = new FileReader();

				fr.onload = function(e){      
					var prj = JSON.parse(e.target.result);
					
					var 	projectModel = new ProjectModel(prj.model),
							id;

					for(id in prj.docs){
						projectModel._add(new DocumentModel(prj.docs[id]), id);
					}

					projectModel._counter = prj._counter;

					App.model && App.model.destroy(); // Trigger destroy event
					App.off();
					App.initialize({
						el: document.body,
						model: projectModel
					});
					App.model.change('opened_ids', prj.model.opened_ids);
					this.model.change('current_doc', prj.model.current_doc);
				}.bind(this);
				fr.onerror = function(e){
					console.log('File reader error');
					console.dir(e);
				};
    			fr.readAsText(file);
    			e.target.value = ''; // reset input
			}
		},
		'onclick exportProject': function(){
			// console.log('TODO download current project');
			// console.dir(this.model);

			if(this.model){
				var 	docs = this.model.get('docs'),
						id;

				var prj = {
					model: {},
					docs: {},
					_counter: this.model._counter,
				};

				this.model.export(['current_doc', 'gridScheme', 'grid_id', 'opened_ids', 'title'], prj.model);
				prj.model.docs = {};

				for(id in docs){
					prj.docs[id] = docs[id].export(['title', 'mime', 'content']);
				}

				downloadFileFromText((this.model.get('title') || 'noname') + '.json', JSON.stringify(prj));
			}
		},
		'onclick clearProject': function(){
			this.startNewProject(true);
		},
		'onclick saveProject': function(){
			this.model.save();
		},
		'onchange projectTitle': function(e){
			this.model.change('title', e.target.value);
		},
		'onclick aboutBtn': function(e){
			new $UI.BasePopupView({
				title: VOC.aboutApp.replace('%d', VER),
				className: 'ppp_base',
				content: 
				'<form data-co="form" class="sc_about-popup">' +
					'<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Major functions</h3>' +
						'<p class="sc_article1">ABC is code editor with syntax highlighter.</p>' +
						'<p class="sc_article1">Supports:</p>' +
						'<ul class="sc_ul1">' +
							'<li>Javascript</li>' +
							'<li>HTML/XML</li>' +
							'<li>CSS</li>' +
							'<li>gettext po</li>' +
						'</ul>' +
					'</div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Document presentation</h3>' +
						'<p class="sc_article1">Available execution web pages (with html document type) with javascript and css.</p>' +
					'</div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Supported Hotkeys</h3>' +
						'<p class="sc_article1">Work with indents:</p>' + 
						'<ul class="sc_ul2">' +
							'<li><b>[Tab] + &lt;selection&gt;</b> - insert indent at begin of line</li>' +
							'<li><b>[Tab + Shift] + &lt;selection&gt;</b> - remove indent at begin of line</li>' +
						'</ul>' +
						'<p class="sc_article1">Creare duplications:</p>' +
						'<ul class="sc_ul2">' +
							'<li><b>[Ctrl + Shift + D]</b> - create duplicate of current line</li>' +
							'<li><b>[Ctrl + Shift + D] + &lt;selection&gt;</b> - create duplicate of selected text</li>' +
						'</ul>' +
						'<p class="sc_article1">Different modifications:</p>' +
						'<ul class="sc_ul2">' +
							'<li><b>[ALT + G]</b> - write line uppercase</li>' +
							'<li><b>[ALT + G] + &lt;selection&gt;</b> - write selection uppercase</li>' +
							'<li><b>[ALT + L]</b> - write a string lowercase</li>' +
							'<li><b>[ALT + L] + &lt;selection&gt;</b> - write a selection lowercase</li>' +
							'<li><b>[ALT + B]</b> - beautifire line (implemented only for JS/JSON documents)</li>' +
							'<li><b>[ALT + B] + &lt;selection&gt;</b> - beautifire selection (implemented only for JS/JSON documents)</li>' +
						'</ul>' +
						'<p class="sc_article1">Navigation between documents:</p>' +
						'<ul class="sc_ul2">' +
							'<li><b>[Alt + Right]</b> - move focus to another opened document</li>' +
						'</ul>' +
					'</div>' +
					'<div class="dwc_btn-group">' +
						'<button class="dwc_btn" type="submit" data-co="submit-btn">' + VOC.close + '</button>' +
						'<button class="dwc_btn" data-co="start-test-prj-btn">' + VOC.start_test_prj + '</button>' +
						'<button class="dwc_btn" data-co="start-default-prj-btn">' + VOC.start_default_prj + '</button>' +
					'</div>' +
				'</form>',
				onopen: function(view){},
				onclose: function(view){},
				popupEvents: {
					'form submit': function(e){
						e.preventDefault();
						this.close();
					},
					'close click': function(e){
						e.stopPropagation();
						this.close();
					},
					'startTestPrjBtn click': function(e){
						e.stopPropagation();
						this.close();
						
						App.controls.loadTestProject.click();
					},
					'startDefaultPrjBtn click': function(e){
						e.stopPropagation();
						this.close();
						App.controls.loadDefaultProject.click();
					}
				},
			}).open();
		},
	};
	MainView.prototype.appendDocument = function(docModel, isSilent){
		var 	hInstance,
				view,
				id = docModel.get('id');

		this.renderMenuItem(docModel.attr);

		switch(docModel.get('mime')){
			case 'text/css': hInstance = new SHighlighter(HighlighterSets.css); break;
			case 'application/json':
			case 'application/javascript': hInstance = new SHighlighter(HighlighterSets.js); break;
			case 'text/xml': 
			case 'text/html': hInstance = new SHighlighter(HighlighterSets.html); break;
			case 'text/gettext': hInstance = new SHighlighter(HighlighterSets.gettext_po); break;
		}
			
		view = new EditView({
			highlight: hInstance,
			model: docModel,
		});
		view.htmlEdit.setText(docModel.get('content') || ' ');
		view.htmlEdit.setCaretPos(0);
		view.el.style.display = 'none';

		this.subView[id] = view;
		
		if(!isSilent){
			this.model.change('current_doc', id);
		}

		// Create presentation of document
		if(docModel.get('mime') == 'text/html'){
			var 	presentationId = docModel.getPresentationID(),
					presentationView = new FrameView({
						appModel: this.model, // add reference to app model
						model: docModel,
					});

			this.subView[presentationId] = presentationView;
		}
		docModel.on('close', function(m, docView){
			this.model.closeSpace(m.get('id'));

			if(this.model.get('current_doc') == m.get('id')){
				this.model.change('current_doc', null);
			}
		}.bind(this));
		docModel.on('change:focus', function(isFocus, m){
			var docListItem = this.listItems[m.get('id')];

			docListItem && docListItem.classList[isFocus ? 'add' : 'remove']('__current');
		}.bind(this));
		docModel.on('destroy', function(m){
			var 	id = m.get('id'),
					docListItem = this.listItems[id];
			
			if(docListItem) docListItem.remove();
			
			// console.log('\t[TRIG destroy model main.view] %s', m.get('id'));
			this.subView[id] = null;
			delete this.subView[id];

			if(m.get('mime') == 'text/html'){
				var presentationId = m.getPresentationID();
				this.subView[presentationId] = null;
				delete this.subView[presentationId];				
			}

			var docs = this.model.get('docs');
			docs[id] = null;
			delete docs[id];
		}.bind(this));
	};

	// @param {String|null} foregroundId - id of project that use for opening
	MainView.prototype.startNewProject = function(foregroundId){
		this.model && this.model.destroy(); // Trigger destroy event
		// TODO create new ProjectModel and reinit it to interface!
		// For using new model we remove old DOM event listeners and reinit model bindings. We need to clear DOM event listeneres, because they defined with model listeners at initialize() method
		this.off();
		this.initialize({
			el: document.body,
			model: ProjectModel.createEmpty()
		});
		this.bus.trigger('start_new_project', this, foregroundId);
	};
	MainView.prototype.renderMenuItem = function(conf){
		var 	div = document.createElement('div'),
				src = '<span class="sc_nav-tab_name">' + Backside._.escape(conf.title) + '</span>';

		if(conf.mime == 'text/html'){
			src += '<span class="sc_nav-tab_compile-btn" data-role="compile-btn">' + VOC.load_page_btn + '</span>';
		}

		// src += '<span class="sc_nav-tab_actions-btn" data-role="actions-btn">&#10998;</span>';
		src += '<span class="sc_nav-tab_actions-btn" data-role="actions-btn">&#8942;</span>';

		div.className = 'sc_nav-tab';
		div.setAttribute('data-id', conf.id);
		div.dataset.id = conf.id;
		div.innerHTML = src;
		this.controls.items.appendChild(div);
		this.listItems[conf.id] = div;
	};
	// @param {String} id - document id
	// @param {Int} spaceCode - id code of space cell, optional
	MainView.prototype.openTab = function(id, spaceCode){
		
		var 	code = this.model.get('gridScheme'),
				space_code = spaceCode,
				$space;

		if(!space_code || !(code & space_code)){
			if(code & SPACE1 && !this.controls.space1.firstElementChild){ // Find available space
				space_code = SPACE1;
			}else if(code & SPACE2 && !this.controls.space2.firstElementChild){
				space_code = SPACE2;
			}else if(code & SPACE3 && !this.controls.space3.firstElementChild){
				space_code = SPACE3;
			}else if(code & SPACE4 && !this.controls.space4.firstElementChild){
				space_code = SPACE4;
			}else{
				space_code = SPACE1;
			}
		} // else land to a determined space-cell

		switch(space_code){
			case SPACE1: $space = this.controls.space1; spaceId = 0; break;
			case SPACE2: $space = this.controls.space2; spaceId = 1; break;
			case SPACE3: $space = this.controls.space3; spaceId = 2; break;
			case SPACE4: $space = this.controls.space4; spaceId = 3; break;
			default:  $space = this.controls.space1; spaceId = 0; break;
		}

		// console.log('\tcall openTab id: %s space: %s, spaceId: %s', id, spaceCode, spaceId);
		// console.dir(this.subView[id]);
		this.model.spaceChange(spaceId, id);
		$4.emptyNode($space);

		if(this.subView[id]){
			var docView = this.subView[id];
			$space.appendChild(docView.el);
			docView.el.style.display = '';

			if(docView instanceof FrameView){
				docView.refresh(this);
			}
		}
	};

	var 	SPACE1 = 0x1,
			SPACE2 = 0x2,
			SPACE3 = 0x4,
			SPACE4 = 0x8,
			HORIZONTAL = 0x10;

	MainView.prototype.changeGrid = function(gridId){
		var code = 0;

		switch(gridId){ 
			case '0': 
				code |= SPACE1;
				code |= SPACE2;
				code |= SPACE4;
				break;
			case '1': 
				code |= SPACE1;
				code |= SPACE2;
				code |= SPACE3;
				break;
			case '2': 
				code |= HORIZONTAL;
				code |= SPACE1;
				code |= SPACE2;
				code |= SPACE3;
				break;
			case '3': 
				code |= HORIZONTAL;
				code |= SPACE1;
				code |= SPACE2;
				code |= SPACE4;
				break;
			case '4': 
				code |= SPACE1;
				code |= SPACE2;
				code |= SPACE3;
				code |= SPACE4;
				break;
			case '5': 
				code |= SPACE1;
				code |= SPACE2;
				break;
			case '6': 
				code |= HORIZONTAL;
				code |= SPACE1;
				code |= SPACE2;
				break;
			case '7': 
				code |= SPACE1;
				break;
		}

		this.model.change('gridScheme', code);
		// TODO check with `&`
		this.controls.selectGrid.value = gridId;
	},
	MainView.prototype._prebindEvents = function(conf){
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
//==========================================
// Ctx Menu
//==========================================
// @param {Object} conf
// @param {HtmlElement} conf.target
// @param {Function} conf.onclick
// TODO add custom items support
function CtxMenu(conf, items){
	this.target = conf.target;
	var _co = {};

	this.target.appendChild(Cr('div', 'sc_ctx').alias('menu', _co).
		append('div', 'sc_ctx-item', VOC.remove_document).data('role', 'remove-document').parent().
		append('div', 'sc_ctx-item', VOC.download_document).data('role', 'download-document').parent().
		root);

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
}


// @param {HtmlElement} conf.label
// @param {HtmlElement} conf.menu
// @param {String} conf.active_cls - activity mark 
function CtxMenu2(conf){
	// Open or hide menu
	conf.label.onclick = function(){
		var $list = conf.menu;

		if($list.style.display == 'none'){ // is hidden
			$list.style.display = '';
			conf.label.classList.add(conf.active_cls);
		}else{
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
}
//==========================================
// DocumentModel 
//==========================================
{
	var DocumentModel = Backside.extend(function(conf){
		Backside.Model.call(this, conf);
	}, Backside.Model);		
	DocumentModel.prototype.getPresentationID = function(){
		return this.get('id') + '-' + this.get('mime');
	}
}
//==========================================
// ProjectModel 
//==========================================
{
	var ProjectModel = Backside.extend(function(conf){
		Backside.Model.call(this, conf);
		this.docIDMap = {};
		this._counter = 0 
	}, Backside.Model);	
	ProjectModel.prototype._add = function(model, id){
		var 	id = id || this._counter++ + '';

		this.attr.docs[id] = model;
		model.set('id', id);
		this.docIDMap[model.get('title')] = id;
		this.trigger('add', model, this);
	}
	ProjectModel.prototype.add = function(list){
		var  	i = list.length;

		while(i-- > 0){
			this._add(list[i]);
		}
	}
	ProjectModel.prototype.spaceChange = function(spaceId, docId){
		if(Array.isArray(this.attr.opened_ids)){
			var pos = this.attr.opened_ids.indexOf(docId);
			
			if(pos != -1){
				// this.attr.opened_ids.splice(pos, 1);
				this.attr.opened_ids[pos] = null;
			}
			
			this.attr.opened_ids[spaceId] = docId;
		}
		this.trigger('spaceChange');
	};
	ProjectModel.prototype.closeSpace = function(docId){
		var pos = this.attr.opened_ids.indexOf(docId);

		if(pos != -1){
			// this.attr.opened_ids.splice(pos, 1);
			this.attr.opened_ids[pos] = null;
		}
		this.trigger('spaceChange');
	};
	ProjectModel.createEmpty = function(){
		return new ProjectModel({
			title: '',
			grid_id: '7', // схема раскладки
			opened_ids: Array(4), // открытые документы
			current_doc: 0, // id of current focused doc
			docs: {}
		});
	}	
}
{
	// Store api
	ProjectModel.prototype.CONTENT_URL = '/content/';
	ProjectModel.prototype.save = function(){
		var hash = $MD.MD5(JSON.stringify(this.attr));

		var 	data = $m.clone(this.attr),
				i = data.docs.length;

		data.key = hash;
		while(i-- > 0){

		}


		// console.log('[CALL save model]');
		// console.log('MD5 %s', hash);
		// console.dir(data);


		new Request(this.CONTENT_URL).post(data, 'application/json').then(function(d, r){
			// console.log('Save success');
			// console.dir(d);
			// console.dir(r);

			if(!d.ec){
				// Use key to modify url query
				history.pushState({
					key: d.key
				}, 'Project', '?project=' + d.key);
			}else{
				// Fail too
			}
		}).catch(function(e){
			// console.log('Save fail');
			// console.dir(e);
		});
	};
	ProjectModel.prototype.load = function(projectId){
		new Request(this.CONTENT_URL + projectId).get().then(function(d, r){
			// console.log('Load success');
			// console.dir(d);
			// console.dir(r);
		}).catch(function(e){
			// console.log('LOAD fail');
			// console.dir(e);
		});
	};
}
//==========================================
// App
//==========================================
var App = new MainView();

document.onreadystatechange = function(){
	// console.log('ReadyState change %s', document.readyState);

	if(document.readyState == 'complete'){
		// Create default 
		App.controls.loadDefaultProject.onclick = function(){
			App.model && App.model.destroy(); // Trigger destroy event
			App.off();

			var projectModel = new ProjectModel({
				title: 'default',
				grid_id: '7', // схема раскладки
				opened_ids: Array(4), // открытые документы
				current_doc: '0', // id of current focused doc
				docs: {},
			});
			projectModel.add([
				new DocumentModel({
					title: 'index.html', // todo rename `fname` -> `title`
					mime: 'text/html',
					content: 
						'<!DOCTYPE html>\n' +
						'<html>\n' +
						'	<head>\n' +
						'		<meta charset="utf-8">\n' +
						'		<link rel="stylesheet" type="text/css" href="./style.css"/>\n' +
						'	</head>\n' +
						'	<body>\n' +
						'		<h1>Hello world!</h1>\n' +
						'		<script src="./script.js"></script>\n' +
						'	</body>\n' +
						'</html>\n'
				}),
				new DocumentModel({
					title: 'style.css',
					mime: 'text/css',
					content: 
						'html{ font: 13px/18px Arial; }	\n' +
						'body{ margin: 0; }\n' +
						'button, input{ font-family: inherit; }\n' +
						'table{ border-collapse: collapse; }\n'
				}),
				new DocumentModel({
					title: 'script.js',
					mime: 'application/javascript',
					content: ''
				}),
				new DocumentModel({
					title: 'readme.txt',
					mime: 'text/plain',
					content: ''
				}),
			]);

			App.initialize({
				el: document.body,
				model: projectModel
			});
		};
		App.controls.loadTestProject.onclick = function(){
			App.model && App.model.destroy(); // Trigger destroy event
			App.off();

			var projectModel = new ProjectModel({
				title: 'dev',
				grid_id: '4', // схема раскладки
				opened_ids: ['0', '1', null, '3'], // открытые документы
				current_doc: '0', // id of current focused doc
				docs: {},
			});
			projectModel.add([
				new DocumentModel({
					title: 'index.html',
					mime: 'text/html',
					content:
						'<!DOCTYPE html>\n' +
						'<html>\n' +
						'	<head>\n' +
						'		<meta charset="utf-8">\n' +
						'		<link rel="stylesheet" type="text/css" href="./style.css"/>\n' +
						'	</head>\n' +
						'	<body>\n' +
						'		<h1>Hello world!</h1>\n' +
						'		<script src="./script.js"></script>\n' +
						'	</body>\n' +
						'</html>\n'
				}),
				new DocumentModel({
					title: 'style.css',
					mime: 'text/css',
					content: 
						':root{\n' +
						'	color: #cccccc;\n' +
						'}\n' +
						'html{ font: 13px/18px Arial; }	\n' +
						'body{ margin: 0; }\n' +
						'button, input{ font-family: inherit; }\n' +
						'table{ border-collapse: collapse; }\n' +
						'#id32:not(.abc){ \n' +
						'	width: calc(var(--abc) + 32px); \n' +
						'	margin: -1.31em; /* .25x desired size */ \n' +
						'	height: 5.24em;  /* 2x desired size */ \n' +
						'	width: 5.24em;   /* 2x desired size */ \n' +
						'	transform: scale(.5); \n' +
						'} \n' +
						''
				}),
				new DocumentModel({
					title: 'script.js',
					mime: 'application/javascript',
					content: 
						'// single line comment\n' +
						'var lines = selectedText.split(\'\\n\').map(str => str.charCodeAt(0) == 9 ? str.substring(1) : str);\n' +
						'/* Double quoteas comment */ var str = "abc";/* multi\n' +
						'	line\n' +
						'comment	*/\n' +
						'var str = \'abc\';\n' +
						'var str = \'ab\\\n' +
						'c\';\n' +
						''
				}),
				new DocumentModel({
					title: 'readme.txt',
					mime: 'text/plain',
					content: 'qwerty\nasdfghjkl\nzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnm\n1234567890123456789012345678901234567890123456789012345678901234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
				}),
				new DocumentModel({
					title: 'test.xml',
					mime: 'text/xml',
					content: 
 						'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"	xmlns:content="http://purl.org/rss/1.0/modules/content/"\n' +
						'	xmlns:wfw="http://wellformedweb.org/CommentAPI/"\n' +
						'	xmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
						'	xmlns:atom="http://www.w3.org/2005/Atom"\n' +
						'	xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n' +
						'	xmlns:slash="http://purl.org/rss/1.0/modules/slash/"\n' +
						'>\n' +
						'<channel>\n' +
						'	<title>Internship &#8211; French Tech Côte d&#039;Azur</title>\n' +
						'	<atom:link href="http://www.clubbusiness06.com/feed/" rel="self" type="application/rss+xml" />\n' +
						'	<description><![CDATA[<p>Vu sur <a rel="nofollow" href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">La Nuit des Associations, samedi 12 novembre 2016 \u00e0 Nice</a></p>\n' +
						'		<p style="font-size:14px; color:#666666; text-align:justify; font-family:Arial, Helvetica, sans-serif;font-weight:bold;">L\u2019engagement associatif est plus que jamais au c\u0153ur de nos pr\u00e9occupations. L\u2019Associatif Azur\u00e9en et ses partenaires s\u2019efforcent tous les ans de mettre en lumi\u00e8re les associations azur\u00e9ennes, leurs initiatives et leur \u0153uvre. <br />\n' +
						'		Pour atteindre cet objectif, l\u2019Associatif Azur\u00e9en, organisera cette ann\u00e9e, en collaboration avec L\u2019Ordre Associatif Mon\u00e9gasque, la 4\u00e8me NUIT DES ASSOCIATIONS, \u00e9dition C\u00f4te d\u2019Azur, le Samedi 12 Novembre 2016 au Palais de la M\u00e9diterran\u00e9e. Ce d\u00eener de gala, dont les b\u00e9n\u00e9fices seront redistribu\u00e9s aux associations azur\u00e9ennes, sera l\u2019occasion d\u2019honorer plusieurs b\u00e9n\u00e9voles, qui se verront remettre les m\u00e9dailles de l\u2019Ordre Associatif Mon\u00e9gasque, afin de r\u00e9compenser leur engagement. Lors de l\u2019\u00e9v\u00e9nement, le troph\u00e9e \u00ab Les Anges du Rocher \u00bb, oscar du secteur associatif, sera remis \u00e0 une association azur\u00e9enne, particuli\u00e8rement m\u00e9ritante, s\u00e9lectionn\u00e9e par notre comit\u00e9.</p>\n' +
						'		<p><a href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">Lire la suite <span class="meta-nav"></span></a></p>\n' +
						'		<p>Cet article <a rel="nofollow" href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">La Nuit des Associations, samedi 12 novembre 2016 \u00e0 Nice</a> est apparu en premier sur <a rel="nofollow" href="http://www.clubbusiness06.com">CLUB BUSINESS 06</a>.</p>\n' +
						'	]]></description>\n' +
						'	<dc:creator><![CDATA[Emmanuel GAULIN]]></dc:creator>\n' +
						'	<category><![CDATA[2. Ev\u00e8nements du Club]]></category>\n' +
						'</channel>\n' +
						''
				}),
				new DocumentModel({
					title: 'translate.po',
					mime: 'text/gettext',
					content: 
						'msgid ""\n' +
						'msgstr ""\n' +
						'	"Language: en_US\\n"\n' +
						'	"MIME-Version: 1.0\\n"\n' +
						'	"Content-Type: text/plain; charset=UTF-8\\n"\n' +
						'	"Content-Transfer-Encoding: 8bit\\n"\n' +
						'\n' +
						'# comment\n' +
						'msgctxt "license"\n' +
						'msgid "License"\n' +
						'msgstr "License"\n' +
						'\n' +
						'msgctxt "5_days_left"\n' +
						'msgid "1 day"\n' +
						'msgid_plural "%d day\\"newbie\\""\n' +
						'msgstr[0] "1 day"\n' +
						'msgstr[1] "%d days"\n' +
						''
				}),
				new DocumentModel({
					title: 'data.json',
					mime: 'application/json',
					content: 
						// '{"item":[{"option":"MailD.ArchiveMaxLevel","result":"EC_OK"},{"option":"MailD.ContainerMaxLevel","result":"EC_OK"},{"option":"MailD.ExePath","result":"EC_OK"},{"option":"MailD.FixedSocketPath","result":"EC_OK"},{"option":"MailD.HeuristicAnalysis","result":"EC_OK"},{"option":"MailD.Log","result":"EC_OK"},{"option":"MailD.LogLevel","result":"EC_OK"},{"option":"MailD.MailD.MilterRuleSet","result":"EC_UNKNOWN_OPTION"},{"option":"MailD.MailMaxLevel","result":"EC_OK"},{"option":"MailD.MaxCompressionRatio","result":"EC_OK"},{"option":"MailD.MilterRuleSet","result":"EC_OK"},{"option":"MailD.MilterSocket","result":"EC_OK"},{"option":"MailD.PackerMaxLevel","result":"EC_OK"},{"option":"MailD.RepackPassword","result":"EC_OK"},{"option":"MailD.ReportLanguages","result":"EC_OK"},{"option":"MailD.RspamdRuleSet","result":"EC_OK"},{"option":"MailD.RspamdSocket","result":"EC_OK"},{"option":"MailD.ScanTimeout","result":"EC_OK"},{"option":"MailD.SpamdRuleSet","result":"EC_OK"},{"option":"MailD.SpamdSocket","result":"EC_OK"},{"option":"MailD.TemplateContacts","result":"EC_OK"},{"option":"MailD.TemplateOrganization","result":"EC_OK"},{"option":"MailD.TemplateQuarantineInfo","result":"EC_OK"},{"option":"MailD.TemplatesDir","result":"EC_OK"}]}\n' +
						'{"abc":"13","xyz":{"field1":"value1"}}\n' +
						'{"abc":"13","xyz":{"field1":"value1"}}\n' +
						'{"abc":"13","xyz":{"field1":"value1"}}' +
						''
				}),
			]);
			// ATTENTION: documentId must be a string!
			App.initialize({
				el: document.body,
				model: projectModel
			});


		};
	}
}

// Here we can listen changes and save data (if necessery)
App.bus.on('start_new_project', function(app, foregroundId){
	// console.log('[START new project] %s', foregroundId);
	// console.dir(app);
	foregroundId && app.model.load(foregroundId);
	// app.model.on('change:grid_id', function(gridId){
	// 	localStorage['grid_id'] = gridId;
	// });
	// app.model.on('spaceChange', function(){
	// 	localStorage['space_map'] = JSON.stringify(app.model.get('opened_ids'));
	// });
	
	// var 	defaultGridId = localStorage['grid_id'],
	// 		spaceMap = localStorage['space_map'];


	// app.model.addDoc('index.html', 'html');
	// app.model.addDoc('script.js', 'js');

	// if(defaultGridId){
	// 	app.model.change('grid_id', defaultGridId);
	// }
	// if(spaceMap){
	// 	app.model.change('opened_ids', JSON.parse(spaceMap));	
	// }
	setTimeout(function(){
		App.events['onclick aboutBtn']();
	}, 200);
});


// Attention: If url contains `?project=` application make attempt to download data from server
var 	QUERY_OPTIONS = parseQuery();

App.startNewProject(QUERY_OPTIONS.project);


