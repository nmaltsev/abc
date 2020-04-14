const BacksideView = require('../../packages/backside/view');

class FrameView extends BacksideView {
  // @param {Backside.Model} appModel
  // @param {Backside.Model} docModel
  constructor(conf) {
    super(conf);
    this.appModel = conf.appModel;
		// Inner resource cash
		this._url_resources = [];
		this._model_resources = [];
  }
  
  initialize(conf) {
		super.initialize(conf);
		this.el.style.display = 'none';
		this._removeEventListeners = this._prebindEvents();
		this.model.listen({
			'closePresentation': (m) => {
				this.clearSubResources();
				this.appModel.closeSpace(m.getPresentationID());
				this.el.remove();
			},
			'destroy': (/*m*/) => {
				this._removeEventListeners();
				this.clearSubResources();
				this.remove();
			},
			'reloadMainFrame': (/*m*/) => {
				this.refresh();
			},
			// This event handler would be flushed when parent view would be removed with all child views
			'change:title': (title/*, m*/) => {
				this.controls.header.textContent = title;
			},
		});
	}
  
  clearSubResources(){
		var 	i = this._url_resources.length;

		while(i-- > 0){
			if (this._model_resources[i]) {
				this._model_resources[i].off('reloadMainFrame');	
			} 
		}

		i = this._url_resources.length;
		while(i-- > 0){
			// revokeObjectURL() for clearing ObjectUrl instances (https://developer.mozilla.org/ru/docs/Web/API/URL/createObjectURL)
			URL.revokeObjectURL(this._url_resources[i]);
		}
		this._model_resources.length = 0;
		this._url_resources.length = 0;
	}
  
	refresh(){ // send reference on application
		this.clearSubResources();
		var 	source = this.model.getSource(),
					_app = this.appModel,
					_docs = _app.get('docs'),
					_self = this,
					blob,
					html;

		this.html = html = source.replace(/\"\.\/([^\"]+)\"/g, function(frag, fname){
			var 	sourceId = _app.docIDMap[fname],
						docModel = _docs[sourceId];
						
			if (!docModel) return sourceId; 

			// on "reload" call refresh
			docModel.on('reloadMainFrame', function(){
				_self.refresh();
			});

			let 	code = docModel.getSource(),
						blob = new Blob([code], {type: docModel.get('mime')}),
						url = URL.createObjectURL(blob);

			_self._model_resources.push(docModel);		
			_self._url_resources.push(url);
			
			return '\"' + url + '\"';
		});
		
		if (true) {
			let docUrl = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
			this.controls.frame.src = docUrl;
			this._url_resources.push(docUrl);
		} else { 
			// Old school method
			// Attention: if document need load external resources (<script src="http://">) there would be troubles after document reloading!
			var doc = this.controls.frame.contentWindow.document;
			doc.open();
			doc.write(html);
			doc.close();				
		}
		
		this.controls.header.textContent = this.model.get('title');
	}

} 
FrameView.prototype.className = 'sc_frame-wrap';
FrameView.prototype.template = 
'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
'<div class="sc_edit-header">' +
  '<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
  '<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
  '<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
  '<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
'</div>';

FrameView.prototype.events = {
  'onclick close': function(){
    this.model.trigger('closePresentation', this.model);
  },
  'onclick reload': function(){
    this.refresh();
  },
  'onload frame': function(e) {
    // Document may not contain a <title> tag
      
    if (
      !this.controls.frame.contentDocument
      || !this.controls.frame.contentDocument.title
      || this.controls.frame.contentDocument.title.length === 0
    ) return;
    this.controls.header.textContent = 'View: ' + this.controls.frame.contentDocument.title;
  },
  'onclick separate': function(e){
    // Create independent instance of page
    var 	_url = URL.createObjectURL(new Blob([this.html], {type: 'text/html'})),
          _window = window.open(_url, '_blank');
          _handler = function (e) {
            URL.revokeObjectURL(_url);
            _window.removeEventListener('beforeunload', _handler);
          };

    _window.addEventListener('beforeunload', _handler);
  },
}

module.exports = FrameView;
