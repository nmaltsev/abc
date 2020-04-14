const BacksideView = require('../../packages/backside/view');

class MarkdownViewer extends BacksideView {
  // @param {Backside.Model} appModel
  // @param {Backside.Model} docModel
  constructor(conf) {
    super(conf);
    this.appModel = conf.appModel;
  }
  
  initialize(conf) {
		super.initialize(conf);
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
			this.updateContent(e.target.contentDocument, this.model.getSource());
		}.bind(this);
	}
  
	refresh() { // send reference on application
		var 	source = this.model.getSource();

		this.controls.frame.contentWindow.location.reload();
		this.controls.header.textContent = this.model.get('title');
	}

	updateContent(doc, source) {
		doc.open()
		doc.write('<style>html{font:12px/16px Arial;color:#333;}body{margin:8px;}p{margin:0 0 8px 0;}pre{display:block;padding:8px;margin: 0 0 1em 0;background:#3a3c56;color:#fff;tab-size:4;}.markdown-code{padding:0 2px;background:#26a75a;color:#fff;}p{margin: 0 0 8px 0;}a{color:#1459dd;}ul{padding: 0 0 0 20px;}</style>');
		doc.write(marked(source));
		doc.close();
	}
}

MarkdownViewer.prototype.className = 'sc_frame-wrap';
MarkdownViewer.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
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

module.exports = MarkdownViewer;
