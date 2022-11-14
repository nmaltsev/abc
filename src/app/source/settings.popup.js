const VOC = require('vocabulary');
const PopupBuilder = require('../lib/PopupBuilder');
const compile = require('../../packages/viewcompiler/viewcompiler');
const { SPACE1, SPACE2, SPACE3, SPACE4, HORIZONTAL } = require('spaces');


module.exports = function(_self){
  return new PopupBuilder(
  {
    className: 'dwc_popup ppp_base',
    content: 
      '<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +

      '<h3 class="sc_header2 sc_section5">' + VOC.settingDialog_header_contentSettings +'</h3>' +
      `
      <section class="sc_section5">
        <h4 class="sc_header3">Editor layout</h4>
        <div class="control-list-item sc_article1">
          <span class="sc_toppanel_text">${VOC.settingDialog_label_grid}</span>
          <select data-co="select-grid" class="control-list-item_control sc_project-select">
            <option value="7" selected>&#9608;</option>
            <option value="6">&#9473;</option>
            <option value="5">&#9475;</option>
            <option value="4">&#9547;</option>
            <option value="0">&#9507;</option>
            <option value="1">&#9515;</option>
            <option value="2">&#9531;</option>
            <option value="3">&#9523;</option>
          </select>
          <div>
            <template *if="gridScheme" *equal="[7,11,15,23,27,19,3]">
              <label> Horizontal proportion: <input
                *model="hp1"
                type="number" min="-3" max="3" step="1" value="0"
              /></label>
            </template>
            <template *if="gridScheme" *equal="[7,11,15,23,27]">
              <label> Vertical proportion: <input
                *model="vp1"
                type="number" min="-3" max="3" step="1" value="0"
              /></label>
            </template>
          </div>
        </div>
      </section>
      ` +
      `<section class="sc_section5">
        <h4 class="sc_header3">General</h4>
        <label class="control-list-item sc_article1">
          <label class="sc-tumbler">
            <input class="sc-tumbler__input" type="checkbox"/>
            <span class="sc-tumbler__checkbox"></span>
          </label>
          <span class="control-list-item_label">${VOC.settingDialog_label_replaceTabBySpace} <i>(beta)</i></span>
        </label>
        <div class="control-list-item sc_article1">
          <span class="control-list-item_label">${VOC.settingDialog_label_tabSize} <i>(beta)</i></span>
          <input class="sc_input control-list-item_control" type="number" min="1" max="8" />
        </div>
        <div class="control-list-item sc_article1">
          <span class="sc_toppanel_text">${VOC.settingDialog_label_theme}</span>
          <select data-co="select-theme" class="control-list-item_control sc_project-select">
            <option value="light">Default</option>
            <option value="theme-b">Light A</option>
            <option value="dark">Dark A</option>
            <option value="theme-a">Dark B</option>
            <option value="theme-c">Dark C</option>
            <option value="theme-d">Dark D</option>
            <option value="theme-e">Dark E</option>
          </select>
        </div>
      </section>` +
      
    '',
    events: {
      'close click': function(e){
        e.stopPropagation();
        this.close();
      },
      'selectGrid change': function(e){
        this.model.change('gridId', e.target.value);
        this.changeGrid(e.target.value);
      },
      'selectTheme change': function(e) {
        var theme = 'light';
        switch(e.target.value){
          case 'dark': theme = 'dark'; break;
          case 'theme-a': theme = 'theme-a'; break;
          case 'theme-b': theme = 'theme-b'; break;
          case 'theme-c': theme = 'theme-c'; break;
          case 'theme-d': theme = 'theme-d'; break;
          case 'theme-e': theme = 'theme-e'; break;
        }
        this.model.change('themeId', theme);
      },
    }
  }, {
    model: _self.stateModel,
    onopen: function(){
      this.controls.selectGrid.value = this.model.get('gridId') || '7';
      this.controls.selectTheme.value = this.model.get('themeId') || 'light';
                                    
      this._unbind = this.model.listen({
        'change:gridScheme': (gridScheme_n, m_o) => {
          if (gridScheme_n == 1 || gridScheme_n == 19) m_o.change('vp1', 0);
          if (gridScheme_n == 1 || gridScheme_n == 3) m_o.change('hp1', 0);
          console.log('SP gs: %s', gridScheme_n);
        },
      }, true);                              
      this.scope = compile(this.controls.body, this.model);
    },
    onclose: function(){
      this.scope.destroy();
      this._unbind();
      _self.$saveInitState(this.model.attr);
    },
    // changeGrid() converts gridId to change:gridScheme  
    changeGrid: function(gridId){
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
    },
  });
};
