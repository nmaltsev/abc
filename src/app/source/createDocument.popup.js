const VOC = require('vocabulary');
const BasePopupView = require('../lib/BasePopupView');
const DocumentModel = require('DocumentModel');
const ExtMimeMap = require('ExtMimeMap');

module.exports = function(_model, _view){
  return new BasePopupView({
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
              '<option value="md">MARKDOWN</option>' +
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
      }.bind(this), 60);
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
        
        if (!file) return;
        var fr = new FileReader();

        // Lock form while file is reading
        this.controls.submitBtn.disabled = true;

        fr.onload = function(e){      
          this.controls.submitBtn.disabled = false;
          this.content = e.target.result;
        }.bind(this);
        fr.onerror = function(e){
          console.warn('File reader error');
          console.dir(e);
        };
        fr.readAsText(file);
        e.target.value = ''; // reset input
      },
    },
  });
};
