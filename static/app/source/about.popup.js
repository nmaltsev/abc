const VOC = require('vocabulary');
const PopupBuilder = require('../lib/PopupBuilder');

module.exports = function(title_s, App){
  return new PopupBuilder({
			title: title_s,
			className: 'dwc_popup ppp_base',
			content: 
				'<form data-co="form" class="about-popup">' +
					'<div class="dwc_popup-close" data-co="close"><svg class="svg-btn-container"><use xlink:href="#svg-cancel"></use></svg></div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Features</h3>' +
						'<p class="sc_article1">ABC is a syntax-highlighting code editor:</p>' +
						'<ul class="sc_ul1">' +
							'<li>Javascript</li>' +
							'<li>HTML/XML</li>' +
							'<li>CSS</li>' +
							'<li>Gettext po</li>' +
              '<li>Markdown</li>' +
						'</ul>' +
						'<p class="sc_article1">Supports direct execution of JavaScript code and HTML pages in a browser.</p>' +
						'<p class="sc_article1">It works offline and allows you to develop a project as in a desktop IDE.</p>' +
					'</div>' +
					'<div class="sc_section1">' +
						'<h3 class="sc_header2">Supported keyboard shortcuts</h3>' +
						'<div data-co="toggle-btn" class="sc_virtual-link __default">' + VOC.show + '</div>' +
						'<div data-co="toggle-list" class="about-popup_hidden-content" style="display: none;">' +
							'<p class="sc_article1">Indents:</p>' + 
							'<ul class="sc_ul2">' +
								'<li><b>[Tab] + &lt;selection&gt;</b> - insertion of an indent at the begin of the line</li>' +
								'<li><b>[Tab + Shift] + &lt;selection&gt;</b> - remove indentation at the beginning of a line</li>' +
							'</ul>' +
							'<p class="sc_article1">Duplications:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[Ctrl + Shift + D]</b> - duplicate the current row</li>' +
								'<li><b>[Ctrl + Shift + D] + &lt;selection&gt;</b> - to create a duplicate of the selected text</li>' +
							'</ul>' +
							'<p class="sc_article1">Code commenting:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[Ctrl + /]</b> - comment the selected code snippet</li>' + //
							'</ul>' +
							'<p class="sc_article1">Code modifications:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[ALT + G]</b> - to convert a string to uppercase</li>' +
								'<li><b>[ALT + G] + &lt;selection&gt;</b> - to convert a selected code snippet to uppercase</li>' +
								'<li><b>[ALT + L]</b> - to convert a string to lowercase</li>' +
								'<li><b>[ALT + L] + &lt;selection&gt;</b> - to convert a selected code snippet to lowercase</li>' +
								'<li><b>[ALT + B]</b> - to beautifier code (implemented only for JS/JSON documents)</li>' +
								'<li><b>[ALT + B] + &lt;selection&gt;</b> - to beautifier seected code snippet (implemented only for JS/JSON documents)</li>' +
							'</ul>' +
							'<p class="sc_article1">Navigation between documents:</p>' +
							'<ul class="sc_ul2">' +
								'<li><b>[Alt + Right]</b> - to focus the next open document</li>' +
								'<li><b>[Alt + R]</b> - to reload the current code in a linked code execution frame. For example, if you update the script, the parent view of the document will be reloaded.</li>' +
							'</ul>' +
						'</div>' +
					'</div>' +
					'<div class="dwc_btn-group">' +
						'<button class="dwc_btn" type="submit" data-co="submit-btn">' + VOC.close + '</button>' +
						'<button class="dwc_btn" data-co="start-test-prj-btn">' + VOC.start_test_prj + '</button>' +
						'<button class="dwc_btn __predefined" data-co="start-default-prj-btn">' + VOC.start_default_prj + '</button>' +
						'<button class="dwc_btn __predefined" data-co="start-react-prj-btn">' + VOC.start_react_prj + '</button>' +
					'</div>' +
				'</form>',
			events: {
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
					if (App.model) App.model.destroy(); // Trigger destroy event

					App.initProject(require('./testProject')());
				},
				'startDefaultPrjBtn click': function(e){
					e.stopPropagation();
					this.close();
					if (App.model) App.model.destroy(); // Trigger destroy event

					const newProject = require('./defaultProject')();
					App.initProject(newProject);
				},
				'startReactPrjBtn click': function(e){
					e.stopPropagation();
					this.close();
					if (App.model) App.model.destroy(); // Trigger destroy event

					const newProject = require('./reactProject')();
					App.initProject(newProject);
				},

				'toggleBtn click': function(e){
					e.preventDefault();
					var $list = this.controls.toggleList;

					if ($list.style.display == 'none') { // show
						$list.style.display = '';
						e.target.textContent =  VOC.hide;
					} else {
						$list.style.display = 'none';
						e.target.textContent =  VOC.show;
					}
				}
			}
		});
}
