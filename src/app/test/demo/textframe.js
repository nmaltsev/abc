(function(ENV){

/*
Control buttons:
Article: <h1, h2,h3,h4,h5, p>
Class: <input>
Clear styles: button
Text align: <left, center, right, justify>
List <ol, ul>
Content: <a, img>
font-size: <input>
text-decoration: <[ ]Bold, [ ]Italic, [ ] Throught, [ ] Underline>

*/

	const KEY = {
		ENTER: 13,
		B: 66,
		D: 68,
		G: 71,
		L: 76,
		SLASH: 191,
		U: 85,
		Y: 89,
		Z: 90,
	};

	class TextFrame {
		constructor($helpers){
			this.$helpers = $helpers;
			this._initialize();
		}
		_initialize(){
			this.el = this.$helpers.cr('iframe');
			this.el.onload = () => {
				this.document = this.el.contentDocument;
				this.window = this.el.contentWindow;

				this._initFrame(this.document);
			};
		}
		_initFrame($doc){
			$doc.designMode = 'on';
			console.log('Init1');
			console.dir(this.el);
			// $doc.body.innerHTML = '<p></p>'; // Fix for Chrome and Firefox: all new lines would be inside <p> tag
			$doc.body.style.whiteSpace = 'pre-wrap';
			// Attention: At Chrome instead of FireFox  first line would be without any tag
			// So for first line that would be in doc.body we need to extract line as   (target).parent().firstElement();
			$doc.execCommand("DefaultParagraphSeparator", false, "p");
			
			$doc.onkeydown = (e) => {
				if(
					(e.ctrlKey || e.shiftKey || e.altKey) // Filter of hotkeys
				){
					if(e.ctrlKey && e.keyCode == KEY.B){
						e.preventDefault();
						console.log('D');
						// doc.execCommand('insertHTML', false, '<figure contenteditable="false">foo</figure>')
						$doc.execCommand('insertHTML', false, '<figure>foo</figure>')
					}
				}
			}

			// Attention: execCommand('insertHTML') procuce oninput event
			$doc.oninput = () => {
				console.log('Inputed');
				// // console.log('`%s`', $doc.body.textContent);
				// console.log('`%s`', $doc.body.innerText);

				// This solution don't work

				// var selection = this._getSelection();
				
				// this.setText($doc.body.innerText);
				// selection.sel.removeAllRanges();
				// selection.sel.addRange(this.setCaretPos(selection.end - selection.size));
			}

			$doc.body.focus();
			


		}
		// Not approved
		_getSelection(){
			var 	sel = this.window.getSelection(),
					range = sel.getRangeAt(0),
					preCaretRange = range.cloneRange();

			preCaretRange.selectNodeContents(this.document.body);
			preCaretRange.setEnd(range.endContainer, range.endOffset);

			return {
				end: preCaretRange.toString().length, // where selection ends IE11 results is differernt from Chrome (not contains \n)
				size: sel.toString().length, // selection length
				sel: sel
			};
		}
		// Not approved
		setText(code){
			this.document.body.style.whiteSpace = 'pre';

			var 	replacePattern = /(\\u[a-f0-9]{4})/ig, // '\u0410-\u044f' at chrome
					count;

			code = code.replace(replacePattern, function(s){
				return '\\u' + s.substring(2);
			});

			
			if(this.$helpers.highlight && this.$helpers.highlight.prettify){
				code = this.$helpers.highlight.prettify(code);
				
				// TODO
				// count = this.countParts(html, '\n');
				// this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);

				this.document.body.innerHTML = code;

				// this.document.execCommand('delete', false, '<i>1</i>');
				// this.document.execCommand('insertHTML', false, code);
			}else{
				// TODO
				// count = this.countParts(code, '\n');
				// this._conf.onLinesCountUpdate && this._conf.onLinesCountUpdate(count);

				// this.document.body.textContent = code;
			}

			console.log('Code');
			console.dir(code);
			// TODO
			// this._conf.onChange(code);
		}
		// To remove
		setCaretPos(pos){
			var 	offset = pos,
					$node = this.document.body,
					range = this.document.createRange(),
					$nodes,
					i;

			while(offset > 0){
				$nodes = $node.childNodes;
				for(i = 0; i < $nodes.length; i++){
					if(offset > $nodes[i].textContent.length){
						offset -= $nodes[i].textContent.length;
					}else{
						$node = $nodes[i];
						break;
					}
				}

				if($node instanceof Text){
					break;
				}
			}
			console.log('setCaretPos: %s', offset);
			console.dir($node);

			range.setStart($node, offset);
			range.collapse(true);
			return range;
		}
	}

	/////////////////////////////////
	// Bind with modular systems
	/////////////////////////////////
	if(ENV.DPROVIDER){
		ENV.DPROVIDER.define('TextFrame', null, function(){
			return TextFrame;
		});
	}else{
		ENV.TextFrame = TextFrame;	
	}
}(this));

