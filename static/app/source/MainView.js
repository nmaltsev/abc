const DocumentModel = require('DocumentModel');
const EditView = require('EditView');
const MarkdownViewer = require('MarkdownViewer');
const JsConsole = require('JsConsole');
const FrameView = require('FrameView');
const ExtMimeMap = require('ExtMimeMap');
const ProjectModel = require('ProjectModel');
const BasePopupView = require('../lib/BasePopupView');
const PopupBuilder = require('../lib/PopupBuilder');
const SHighlighter = require('SHighlighter');
const HighlighterSets = require('HighlighterSets');
const Configs = require('Configs');
const BacksideView = require('../../packages/backside/view'); 
const BacksideModel = require('../../packages/backside/model'); 
const BacksideEvents = require('../../packages/backside/events'); 
const BacksideUtils = require('../../packages/backside/utils'); 
const $4 = require('../../packages/$4/index');
const VOC = require('vocabulary');
const downloadFileFromText = require('../lib/downloadFile');
const {CtxMenu, CtxMenu2} = require('../lib/ctxMenu');
const createAboutPopup = require('about.popup');
const createRenameDocPopup = require('renameDocument.popup');
const createDocumentPopup = require('createDocument.popup');
const createSettingsPopup = require('settings.popup');

const LOCALSTORAGE_AVAILABLE = Configs.LOCALSTORAGE_AVAILABLE;

// Code editor with syntax highlighting v201 2019/12/01
// (C) 2015-2020
const VER = 202;

const {
  SPACE1, SPACE2, SPACE3, SPACE4, HORIZONTAL,      
} = require('spaces');

//==========================================
// MainView
//==========================================
class MainView extends BacksideView {

  constructor(conf, $getInitState, $saveInitState) {
    super(conf);
    this.subView = Object.create(null);
    this.bus = new BacksideEvents();
    this.listItems = {};
    this.$getInitState = $getInitState;
    this.$saveInitState = $saveInitState;
  }
  
  initialize(conf) {
    super.initialize(conf);
    this._prebindEvents();
		this.stateModel = new BacksideModel();

		this.stateModel.listen({
			'change:showProjectList': (showProjectList/*, m*/) => {
				this.controls[showProjectList ? 'projects' : 'items'].style.display = '';
				this.controls[!showProjectList ? 'projects' : 'items'].style.display = 'none';
				
				if(this.controls.items.parentNode.style.display == 'none'){
					this.stateModel.change('hideListPanel', false);
				}
			},
			'change:hideListPanel': (hideListPanel, m) => {
				this.controls.items.parentNode.style.display = hideListPanel ? 'none' : '';
				this.controls.toggleListBtn.textContent = hideListPanel ? '>' : '<';
				// the application saves its states each time the property is changed
				this.$saveInitState(m.attr);
			},
			// Attention: gridId converting to gridScheme 
			'change:gridScheme': (code) => {
				this.controls.space1.style.display = (code & SPACE1) ? '' : 'none';
				this.controls.space2.style.display = (code & SPACE2) ? '' : 'none';
				this.controls.space3.style.display = (code & SPACE3) ? '' : 'none';
				this.controls.space4.style.display = (code & SPACE4) ? '' : 'none';

				if (code & SPACE2 || code & SPACE4) {
					this.controls.half2.style.display = '';
				} else {
					this.controls.half2.style.display = 'none';
				}

				if (code & HORIZONTAL) {
					this.controls.grid.style.flexDirection = 'column';
					this.controls.half1.style.flexDirection = 'row';
					this.controls.half2.style.flexDirection = 'row';
				} else {
					this.controls.grid.style.flexDirection = 'row';
					this.controls.half1.style.flexDirection = 'column';
					this.controls.half2.style.flexDirection = 'column';
				}
			},
			'change:themeId': (themeId) => {
				var 	className;
				
				switch (themeId) {
					case 'dark': className = 'theme-dark'; break;
					case 'theme-a': className = 'theme-a'; break;
					case 'theme-b': className = 'theme-b'; break;
					case 'theme-c': className = 'theme-c'; break;
					case 'theme-d': className = 'theme-d'; break;
					case 'theme-e': className = 'theme-e'; break;
				}
	
				this.controls.grid.className = 'sc_layout-right grid_column ' + className;
			},
      'change:hp1': (value_n, m_o) => {
        this.controls.half1.style.flexGrow = Math.pow(2, value_n);
      },
      'change:vp1': (value_n, m_o) => {
        this.controls.space1.style.flexGrow = Math.pow(2, value_n);
        this.controls.space2.style.flexGrow = Math.pow(2, value_n);
      },
		});
  }
  
  /**
   * @param {ProjectModel} model
   * @return {void}
   */
  initProject(model) {
  this.model = model;
	this.model.listen({
	  'change:current_doc': (id) => {
	    if (!this.subView[id]) return;
		  
	    this.openTab(id);
	    // Focusing an HtmlEditor if a view has an editor 
	    this._stayFocusOnDoc(id);
	  },
	  'change:gridId': (gridId) => {
	    this.changeGrid(gridId);
	  },
	  'change:opened_ids': (openedIds) => {
	    for(var i = 0; i < openedIds.length; i++){
	      openedIds[i] !== null && this.openTab(openedIds[i], 1 << i); // 1<<0 == 1, 1<<1 == 2 
	    }
	  },
	  'destroy': () => {
	    $4.emptyNode(this.controls.items);
	    var 	id,
				    docs = this.model.get('docs');
	    
	    for(id in docs) {
		    docs[id].destroy();
	    }
	    for(id in this.subView) {
		    if (this.subView[id]) this.subView[id].remove();
	    }
	  },
	  'add': (documentModel) => {
	    this.appendDocument(documentModel);
	  },
	  'change:remoteDocId': (remoteDocId) => {
	    console.log('[change:remoteDocId] %s', remoteDocId);
	    window.history.pushState({remoteDocId}, 'Project', '?project=' + encodeURIComponent(remoteDocId));
	  },
	});
	// Attention: Quick and dirty method to find the next available document by <pre> node at DOM
	this.bus.on('focus_next_doc', function(v){
		var 	openedDocs = this.model.get('opened_ids');
		var 	pos = openedDocs.indexOf(v.model.get('id'));
		var		checkList = Array.prototype.concat.call(openedDocs.slice(pos + 1), openedDocs.slice(0, pos));
			
		for (var i = 0 ; i < checkList.length; i++) {
		  let subView = this.subView[checkList[i]];
		  if (!subView || !subView.htmlEdit) continue;
			
		  subView.htmlEdit.el.focus();
		  setTimeout(function(){
			  subView.htmlEdit.setCursor(subView._lastPos || 0);
		  }, 60);
		  // subView.htmlEdit.setCursor(subView._lastPos || 0);
		  break;
		}
	}.bind(this));

		let  	docs = this.model.get('docs');
		let		openedIds = this.model.get('opened_ids');

		for (let id in docs) {
			this.appendDocument(docs[id], true);	
		}
    
    // stateModel defines a state of the IDE		
		this.stateModel.change(
		  Object.assign({ // Merge in default settings
		    showProjectList: false,
		    hideListPanel: false,
		    gridId: '7',
		    gridScheme: 0 | SPACE1,
		    themeId: 'light',
		  }, this.$getInitState && this.$getInitState() || {})
		);
		if(openedIds) this.model.change('opened_ids', openedIds, true);
    // Attention: force triggering current_doc will reopen the document and change the list of opened documents!
    this._stayFocusOnDoc(this.model.get('current_doc'));
    this.controls.projectTitle.value = this.model.get('title') || 'noname';

      CtxMenu2({
        label: this.controls.toppanelMenuLabel,
        menu: this.controls.toppanelMenuList,
        active_cls: '__active',
      });
    }

  /**
   * @param {string} id - a document id
   * @return {void}
   */
	_stayFocusOnDoc(id) {
		const currentView = this.subView[id];
    
		if (!currentView || !currentView.htmlEdit) return;
    
    setTimeout(function(){
      currentView.htmlEdit.el.focus();
    }, 100);
	}
  
  /**
   * @return {void}
   */
  _saveModel() {
    if (!LOCALSTORAGE_AVAILABLE) return;
    setTimeout(() => {
      try {
        window.localStorage['lastsnapshot'] = JSON.stringify(this.model.createProjectSnapshot());	
      } catch(e) {
        if (e.name == 'QuotaExceededError') {
          console.warn("Not enought spaces granted for localStorage");
        }
      }
    }, 200);	
  }

	appendDocument(docModel, isSilent) {
		var 	hInstance,
          view,
          id = docModel.get('id');

		this.renderMenuItem(docModel.attr);

		switch (docModel.get('mime')) {
			case 'text/css': hInstance = new SHighlighter(HighlighterSets.css); break;
			case 'application/json':
			case 'application/javascript': hInstance = new SHighlighter(HighlighterSets.js); break;
			case 'text/xml': 
			case 'text/html': hInstance = new SHighlighter(HighlighterSets.html); break;
			case 'text/gettext': hInstance = new SHighlighter(HighlighterSets.gettext_po); break;
      case 'text/markdown': hInstance = new SHighlighter(HighlighterSets.markdown); break;
		}

		view = new EditView({
			highlight: hInstance,
			model: docModel,
			// Turn off line numeration for Markdown
			numerateLines: docModel.get('mime') != 'text/markdown',
			parent: this, // Reference to the application
		});

		view.htmlEdit.setText(docModel.get('content') || '');
		view.htmlEdit.setCaretPos(0);
		view.htmlEdit._history.add({
			text: docModel.get('content') || '',
			start: 0,
			end: 0
		});

		view.el.style.display = 'none';
		this.subView[id] = view;
		
		if (!isSilent) {
			this.model.change('current_doc', id);
		}

		// Create presentation of document
		if (docModel.get('mime') == 'text/html') {
			let 	presentationId = docModel.getPresentationID(),
            presentationView = new FrameView({
              appModel: this.model, // add reference to app model
              model: docModel,
            });

			this.subView[presentationId] = presentationView;
		}
    
    docModel.listen({
      'close': function(m, docView){
        this.model.closeSpace(m.get('id'));

        if (this.model.get('current_doc') == m.get('id')) {
          this.model.change('current_doc', null);
        }
      }.bind(this),
      'change:focus': function(isFocus, m){
        const docId = m.get('id');
        const docListItem = this.listItems[docId];
        
        this.model.set('current_doc', docId);

        if (docListItem) docListItem.classList[isFocus ? 'add' : 'remove']('__current');
      }.bind(this),
      'destroy': function(m){
        var 	id = m.get('id'),
              docListItem = this.listItems[id];
        
        if (docListItem) docListItem.remove();
        
        this.subView[id] = null;
        delete this.subView[id];

        if (
          m.get('mime') == 'text/html' 
          || m.get('mime') == 'application/javascript'
        ){
          let 	presentationId = m.getPresentationID();
          this.subView[presentationId] = null;
          delete this.subView[presentationId];
        }

        let docs = this.model.get('docs');
        docs[id] = null;
        delete docs[id];
        this._saveModel();
      }.bind(this),
      'change:content': function(content, m){
        this._saveModel();
      }.bind(this),
      'change:title': function(title, m){
        var 	docMenuItem = this.listItems[m.get('id')],
              $title = docMenuItem.querySelector('.sc_nav-tab_name');

        $title.textContent = title;	

        if (m.previous.hasOwnProperty('title')) {
          delete this.model.docIDMap[m.previous.title];
        }
        this.model.docIDMap[m.get('title')] = m.get('id');
      }.bind(this),
    });
	}
  
  // @param {string} [foregroundId] - id of the opened project
  startNewProject(foregroundId) {
    if(this.model) this.model.destroy(); // Trigger destroy event

    this.initProject(ProjectModel.createEmpty());
    this.bus.trigger('start_new_project', this, foregroundId);
  }
  
 	renderMenuItem(conf) {
		var 	div = document.createElement('div'),
          src = '<span class="sc_nav-tab_name">' + BacksideUtils.escape(conf.title) + '</span>';

		if (conf.mime == 'text/html' || conf.mime == 'application/javascript' || conf.mime == 'text/markdown') {
			src += '<span class="sc_nav-tab_compile-btn" data-role="compile-btn">' + VOC.load_page_btn + '</span>';
		}

		src += '<span class="sc_nav-tab_actions-btn" data-role="actions-btn">&#8942;</span>';
		div.className = 'sc_nav-tab';
		div.setAttribute('data-id', conf.id);
		div.dataset.id = conf.id;
		div.innerHTML = src;
		this.controls.items.appendChild(div);
		this.listItems[conf.id] = div;
	}
	// @param {String} id - document id
	// @param {Int} spaceCode - id code of space cell, optional
	openTab(id, spaceCode) {
		let code = this.stateModel.get('gridScheme');
    let space_code = spaceCode;
    let $space, spaceId;

		if (!space_code || !(code & space_code)) {
			if (code & SPACE1 && !this.controls.space1.firstElementChild) { // Find available space
				space_code = SPACE1;
			} else if (code & SPACE2 && !this.controls.space2.firstElementChild) {
				space_code = SPACE2;
			} else if (code & SPACE3 && !this.controls.space3.firstElementChild) {
				space_code = SPACE3;
			} else if (code & SPACE4 && !this.controls.space4.firstElementChild) {
				space_code = SPACE4;
			} else {
				space_code = SPACE1; 
			}
		} // else land to a determined space-cell

		switch (space_code) {
			case SPACE1: $space = this.controls.space1; spaceId = 0; break;
			case SPACE2: $space = this.controls.space2; spaceId = 1; break;
			case SPACE3: $space = this.controls.space3; spaceId = 2; break;
			case SPACE4: $space = this.controls.space4; spaceId = 3; break;
			default: $space = this.controls.space1; spaceId = 0; break;
		}

		this.model.spaceChange(spaceId, id);
		$4.emptyNode($space);

		if (this.subView[id]) {
			let docView = this.subView[id];
			$space.appendChild(docView.el);
			docView.el.style.display = '';

      if(docView instanceof FrameView || docView instanceof JsConsole || docView instanceof MarkdownViewer){
				docView.refresh(this);
			}
		}
	}

  openAboutPopup() {
		createAboutPopup(
      VOC.aboutApp.replace('%d', VER),
      this
    ).open();
	}
};
	
MainView.prototype.events = {
  'onclick items': function(e){
    let $tab = $4.closest(e.target, '.sc_nav-tab');
    if (!$tab) return;
    
    let role = e.target.dataset && e.target.dataset.role;
    let doc = this.model.get('docs')[$tab.dataset.id];
    //=========================================
    // TODO refactor opening document
    // SET focus on new document not add class Here!
    //=========================================
    if (role == 'compile-btn') {
      let 	presentationId = doc.getPresentationID();

      if (!this.subView[presentationId]) { // Add presentation view on demand
        if (doc.get('mime') == 'application/javascript') {
          this.subView[presentationId] = new JsConsole({
            appModel: this.model, // add reference to app model
            model: doc,
          });							
       } else if (doc.get('mime') == 'text/markdown') {
          this.subView[presentationId] = new MarkdownViewer({
            appModel: this.model, // add reference to app model
            model: doc,
          });	
        }
      }
      if (this.subView[presentationId] != null){
        this.model.change('current_doc', doc.getPresentationID());
      } else {
        console.warn('No presentation view: %s', presentationId);
      }
    } else if (role == 'actions-btn') {
      e.stopPropagation();

      CtxMenu({
        target: e.target,
        onclick: function(role){
          if (role == 'remove-document') {
            // Attention: Removing trigger destroy and close events
            doc.destroy();
          } else if(role == 'download-document') {
            downloadFileFromText(doc.get('title'), doc.getSource());
          } else if(role == 'rename-document') {
            createRenameDocPopup(
              VOC.popupRenameDoc_title.replace('%s', doc.get('title')),
              doc
            ).open();
          }
        }.bind(this)
      }, [
        {label: VOC.remove_document, role: 'remove-document'},
        {label: VOC.download_document, role: 'download-document'},
        {label: VOC.rename_document, role: 'rename-document'},
      ]);
    } else {
      console.log('before change current_doc %s', $tab.dataset.id);
      this.model.change('current_doc', $tab.dataset.id);
    }
  },
  'onclick toolsAddBtn': function(){ // Add new document
    createDocumentPopup(this.model, this).open();
  },
  'onclick lastProjectsBtn': function(){
    this.stateModel.change('showProjectList', !this.stateModel.get('showProjectList'));
  },
  'onclick toggleListBtn': function(){
    this.stateModel.change('hideListPanel', !this.stateModel.get('hideListPanel'));
  },
  'onclick settingsBtn': function(e) {
    createSettingsPopup(this).open();
  },
  'onchange importProject': function(e) {
    var file = e.target.files[0];

    if (!file) return;
    
    let fr = new FileReader();

    fr.onload = function(e){      
      const prj = JSON.parse(e.target.result);
      const projectModel = new ProjectModel(prj.model);

      if(this.model) this.model.destroy(); // Trigger destroy event
      this.initProject(projectModel);
      this.model.change('opened_ids', prj.model.opened_ids);

      this._stayFocusOnDoc(prj.model.current_doc);
    }.bind(this);
    fr.onerror = function(e){
      console.log('File reader error');
      console.dir(e);
    };
    fr.readAsText(file);
    e.target.value = ''; // reset input
  },
  'onclick exportProject': function(){
    if (!this.model) return;
    downloadFileFromText((this.model.get('title') || 'noname') + '.json', JSON.stringify(this.model.createProjectSnapshot()));
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
    this.openAboutPopup();
  },
  'onclick uploadProject': function(e) {
    if (!this.model) return;
    this.model.save();
  },
};

module.exports = MainView;
