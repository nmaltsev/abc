const VOC = require('vocabulary');
const PopupBuilder = require('../lib/PopupBuilder');

module.exports = function(title_s, doc){
  return new PopupBuilder({
    title: title_s,
    className: 'dwc_popup ppp_base',
    content: 
      '<form data-co="form" class="">' +
        '<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
        '<div class="sc_section4">' +
          '<label class="input-frame">' +
            '<input class="input-frame_input" type="text" required data-co="new-fname"/>' +
            '<span class="input-frame_placeholder">' + VOC.popupRenameDoc_fnamePlaceholder+ '</span>' +
          '</label>' +
        '</div>' +
        '<div class="dwc_btn-group">' +
          '<button class="dwc_btn __predefined" type="submit" data-co="submit-btn">' + VOC.btn_apply + '</button>' +
          '<button class="dwc_btn" type="reset">' + VOC.btn_cancel + '</button>' +
        '</div>' +
      '</form>',
    css: {
      width: '480px',
    },
    events: {
      'form submit': function(e){
        e.preventDefault();
        this.close(true);
      },
      'close click': function(e){
        e.stopPropagation();
        this.close();
      },
      'form reset': function(e){
        e.stopPropagation();
        this.close();
      },
      'newFname input': function(e){
        e.target.classList[e.target.value ? 'add' : 'remove' ]('__not-empty');
      },
    }
  }, {
    onopen: function(){},
    onclose: function(popup, submitted){
      if (!submitted) return;
      let newFname = this.controls.newFname.value;
      doc.change('title', newFname);
    }
  });
};
