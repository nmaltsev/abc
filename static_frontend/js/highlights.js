//==========================================
// SyntaxHighlighter
//==========================================
;DPROVIDER.define(null, function SHighlighter(){
	function SHighlighter(conf){
		this.pattern = conf.PATTERN;
		this.transformer = conf.transformer.bind(conf);
		this.commOpen = conf.commOpen;
		this.commClose = conf.commClose;
	}
	SHighlighter.prototype.htmlspecialchars = function(str){
		return str ? str.replace(/[<>&]/g, function(m){
			return m == '<' ? '&lt;' : m == '>' ? '&gt;' : '&amp;';
		}) : '';
	};
	SHighlighter.prototype.prettify = function(str){
		// Escape unicode characters
		/*str = str.replace(/([\u0080-\u0400\u04FF-\uFFFF])/g, function(s){
			var 	c = s.charCodeAt(0).toString(16), 
					i = 4 - c.length; 

			while(i-- > 0) c = '0' + c; 
			return '\\u' + c;
		});*/

		return this.htmlspecialchars(str).replace(this.pattern, this.transformer);
	};

	return SHighlighter;
});
;DPROVIDER.define(null, function HighlighterSets(){
	function span(className, value){
		return '<span class="' + className + '">' + value + '</span>';
	}

	return {
		js: {
			PATTERN: new RegExp(
				''
				+ '(\\%b\\d+b\\%)' // @codeBlock
				+ '|'
				+ "(//.*(?=[\\n]|$))|" + // single line comment
				'(\\/\\*[\\s\\S]*?($|\\*\\/))|' + // multiline comment
				// '((?:\"[^\"\\\\]*(?:\\\\.[^\"\\\\]*)*\")|(?:\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'))|' + // single or double quote strings
				// Attention: `.?` skip '\n' so it fix by (*)
				'((?:\"[^\"\\\\]*(?:\\\\.?[^\"\\\\]*)*\")|(?:\'[^\'\\\\]*(?:\\\\.?[^\'\\\\]*)*\'))|' + // single or double quote strings
				'(`[\\s\\S]+?`)|' + // multiline js strings
				'(' + // regular expression literal 
					'(?:\\/[^\\s]+(?!\\\\)\\/)[img]{0,3}(?!\\d)(?=\\s*[\\;,\\x5d\\x29\\x2e\\n]?)' +
				')|' +		
				// '(?:(?=function\\s*)([\\w\\d\\-\\_\\$]+)(?=\\s*\\())|' + // function name
				'(function)(\\s*)([\\w\\d\\-\\_\\$]+)(\\s*\\()' + // function name
				// Attention `constructor` is not keyword
	            "|(\\b(?:break|continue|do|in|else|for|if|return|while|with|switch|case|var|function|new|const|let|true|false|typeof|throw|Infinity|import|export|from|super|class|extends|this)\\b)" + // @keywords
				"|(\\b(?:(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?)|(?:undefined|null)\\b)|" + // numbers
				//"(?:\\.([@\\w]+)(?=[(]))|" + // method chaining
				//"(?:\\b([@\\w]+)(?=[(]))", // function execution
	            "(?:([@\\w]+)(?=[(]))" // function execution
	            + '|(\{|\})' // @figBrackets
	            , 
			'g'),
			transformer: function(subStr, codeBlock,p1, p2, p2end, str1, str2, reg, funcDef, funcSplit, funcName, funcBrack, keywords, p6, method, /*funcExc, */figBrackets){
				if(codeBlock != undefined){
					// DOM content must contains code block identificator and be the same size as relative model item
					
					return '<i class="sh-codeblock" data-id="' + codeBlock.substr(2, codeBlock.length - 4) + '"><span class="sh-codeblock_inner" contenteditable="false">' + codeBlock + '</span></i>';
					
					
					// return '<i class="sh-codeblock2" data-id="' + codeBlock.substr(2, codeBlock.length - 4) + '"><span class="sh-codeblock_inner2">' + codeBlock + '</span>' + '<i class="sh-codeblock_inner3">{...}</i>' + '</i>';
					// return '<i class="sh-codeblock2" data-id="' + codeBlock.substr(2, codeBlock.length - 4) + '"><span class="sh-codeblock_inner2">' + codeBlock + '</span>' + '</i>';
					
				}else if(p1 != undefined){
					return '<span class="sh_js_comment">' + subStr + '</span>';
				}else if(p2 != undefined){
					return '<span class="sh_js_comment sh_multiline">' + subStr.replace(/\n/g, '</span>\n<span class="sh_js_comment sh_multiline">') + '</span>';
				}else if(str1 != undefined || reg != undefined){
					var pos, prev = 0; // Fix '\\n' at string liter const, cut line if new line symbol (\n) not escaped (*)

					while(pos != -1){
						pos = subStr.indexOf('\n', prev);
						prev = pos + 1;
						if(subStr[pos - 1] != '\\'){
							break;
						}
					}
					if(pos != -1){
						return '<span class="sh_js_string">' + subStr.substring(0, pos) + '</span>' + subStr.substring(pos);
					}
					return '<span class="sh_js_string">' + subStr + '</span>';
				}else if(str2 != undefined){
					return '<span class="sh_js_string sh_multiline">' + subStr.replace(/\n/g, '</span>\n<span class="sh_js_string sh_multiline">') + '</span>';
				}else if(funcDef != undefined){	
					// TODO refactor at feature
					var s = '<span class="sh_js_keyword">' + funcDef + '</span>';

					if(funcSplit){
						s += funcSplit;
					}
					if(funcName){
						s += '<span class="sh_js_func-name">' + funcName + '</span>';	
					}				
					if(funcBrack){
						s += funcBrack; 
					}
					return s;
				}else if(keywords != undefined){
					return '<span class="sh_js_keyword">' + subStr + '</span>';
				}else if(p6 != undefined){
					return '<span class="sh_js_number">' + subStr + '</span>';
				}/*else if(method != undefined){
					return '.<span class="sh_js_method">' + method + '</span>';
				}else if(funcExc != undefined){
					return '<span class="sh_js_method">' + funcExc + '</span>';
				}*/
	            else if(method != undefined){
					return '<span class="sh_js_method">' + method + '</span>';
				}else if(figBrackets){
					return span('sh-js_brackets', figBrackets);
				}
			},
			commOpen: '//',
			commClose: ''
		},
		html: {
			// ATTR: /([\w\d\-\:_]+)(\s*=\s*)?(\"[^\"]*\"|\'[^\']*\'|[^&\s]*)?/g,
			ATTR: /([\w\d\-\:_]+)(?:(\s*=\s*)(\"[^\"]*\"|\'[^\']*\'|[^&\s]*))?/g,
			PATTERN: new RegExp(
				// "(&lt;\\!\\[CDATA\\[[\\s\\S]*?\\]\\]&gt;)|(&lt;[!?][^&]+&gt;|&lt;\\!--[\\s\\S]+?--&gt;)|(&lt;(?:/)?(?:[\\w\\-_:]+))" + // <![CDATA[<p>]]>, Comments(<!...>, <?...>) and tag name (<abc:x_y-z>)
				"(&lt;\\!\\[CDATA\\[[\\s\\S]*?\\]\\]&gt;)|(&lt;[!?][^&]+&gt;|&lt;\\!--[\\s\\S]+?--&gt;)|(&lt;/?[\\w\\-_:]*)" + // <![CDATA[<p>]]>, Comments(<!...>, <?...>) and tag name (<abc:x_y-z>)
				// "((?:\\s+[\\w\-_]+(?:\\s*=\\s*(?:\".*?\"|'.*?'|[^&\\s]+))?)*\\s*)" +
				"((?:\\s+[\\w\\-:_]+(?:\\s*=\\s*(?:\"[\\s\\S]*?\"|'[\\s\\S]*?'|[^&\\s]*))?)*\\s*)" + // Attrribute
				"((?:/)?&gt;)?", 
			'g'),
			transformer:  function(subStr, cdata, comment, p1, p2, p3, p4, p5, p6){
				if(cdata){
					return '<span class="sh_html_cdata">' + cdata.replace(/\n/g, '</span>\n<span class="sh_html_cdata">') + '</span>';
				} 
				if(comment){
					return '<span class="sh_html_comment">' + comment.replace(/\n/g, '</span>\n<span class="sh_html_comment sh_multiline">') + '</span>';
				}
				if(p1 != undefined){
					var hstr = '<span class="sh_html_tag">' + p1 + '</span>';
					
					if(p2){

						var attr = p2.replace(this.ATTR, function(subStr, attr, sep, val){
							var res = '';

							if(attr){
								res += '<span class="sh_html_attr-name">' + attr + '</span>';
							}
							if(sep){
								res += sep;
							}
							if(val){
								res += '<span class="sh_html_attr-value">' + val.replace(/\n/g, '</span>\n<span class="sh_html_attr-value">') + '</span>';
							}
							return res;
						});

						hstr += '<span class="sh_html_attr-line">' + attr + '</span>';
					}
					if(p3) hstr += '<span class="sh_html_tag">' + p3 + '</span>';
					return hstr;
				}
			},
			commOpen: '<!--',
			commClose: '-->'
		},
		css: {
			// PATTERN: /(\/\*[\w\W]+?\*\/)|([a-z\-_]+)(?=\s*\:)|(\#[abcdef0-9]{3,6})|([\#\.][\w\d\-_]+)(?=\s*[~>\[\{\,\+\:]?)|(\:{1,2}[\a-z\-_]+)(?=\s|\>|\~|\+|\{)|(\"[^\"]*\"|\'[^\']*\')/g,
			PATTERN: new RegExp(
				'(\\/\\*[\\w\\W]*?\\*\\/)|([a-z\\-_]+)(?=\\s*\\:)|(\\#[abcdef0-9]{3,6})|([\\#\\.][_\\-a-z][\\w\\d\\-_]*)(?=\\s*[~>\\[\\{\\,\\+\\:]?)|(\\:{1,2}[\\a-z\\-_]+)(?=\\s|\\>|\\~|\\+|\\,|\\{)|(\"[^\"]*\"|\'[^\']*\')' +
				'|([\\w\\-\\_]+\\(|\\))',
				'ig'),
			transformer: function(subStr, comment, propertyName, hexColor, classSelector, pseudoclass, string, funcName, funcArg){
				if(comment){
					return '<span class="sh_css_comment sh_multiline">' + comment.replace(/\n/g, '</span>\n<span class="sh_css_comment sh_multiline">') + '</span>';
				}
				if(classSelector != undefined){
					return '<span class="sh_css_class-selector">' + subStr + '</span>';
				}else if(propertyName != undefined){
					return '<span class="sh_css_property">' + subStr + '</span>';
				}else if(hexColor != undefined){
					return '<span class="sh_css_hex-color">'  + '<i class="sh_css_color-mark" style="background:' + subStr + '"></i>' + subStr + '</span>';
				}else if(pseudoclass != undefined){
					return '<span class="sh_css_pseudo">' + subStr + '</span>';
				}else if(string != undefined){
					return '<span class="sh_css_string">' + subStr + '</span>';
				}else if(funcName != undefined){
					return '<span class="sh_css_func">' + funcName + '</span>';
				}
			},
			commOpen: '/*',
			commClose: '*/'
		},
		gettext_po: {
			// ((?:\"[^\"\\\\]*(?:\\\\.?[^\"\\\\]*)*\")
			PATTERN: /(\#.*)|("[^"\\]*(?:\\.?[^"\\]*)*")|(\[\d*\])|(\b(?:msgctxt|msgid|msgid_plural|msgstr)\b)/ig,
			transformer: function(substr, comm, str, num, keyword){
				if(comm){
					return '<span class="sh_po_comment">' + comm + '</span>';
				}else if(str){
					return '<span class="sh_po_string">' + str + '</span>';
				}else if(num){
					return '<span class="sh_po_number">' + num + '</span>';
				}else if(keyword){
					return '<span class="sh_po_keyword">' + keyword + '</span>';
				}
			},
			commOpen: '#',
			commClose: ''
		},

		// TODO
		// ***\n - horizontal line (<hr/>) \n****\n

	    markdown: {
	        // PATTERN: /\[([^\]]*)\]\(([^\)]*)\)|(\#+)(.+\n)|```([\s\S]*?)```|`(.*?)`|\*\*([\s\S]*?)\*\*/ig,
	        PATTERN: /\[([^\]]*)\]\(([^\)]*)\)|(\#+\s+)(.+)\n|```(.+)?\n([\s\S]*?)```|`(.*?)`|(\*+)([^*\n]+)(\*+)/ig, 
	        transformer: function($sub_s, hyp_text, hyp_link, title_type, title_text, code_type, code, code_line, multiline_text_open, multiline_text, multiline_text_close, $pos){
	            if(hyp_text != null){
	                return '<span class="sh_markdown_hyptext">[' + hyp_text + ']</span>' + '<span class="sh_markdown_hyplink">(' + (hyp_link || '') + ')</span>';
	            }else if(title_type){
	            	title_type = title_type.trim();
	                //return '<div class="sh_markdown_title sh_markdown_titlesize' + title_type.length + '">' + title_type + (title_text || '')/*.replace(/\n/g, '')*/ + '</div>';
	                return '<span class="sh_markdown_title sh_markdown_titlesize' + title_type.length + '">' + title_type + '&nbsp;' + (title_text || '') + '</span>\n';
	            }else if(typeof(code_line) == 'string'){ // fix empty string
	                return '<i class="sh_markdown_code">`' + code_line + '`</i>';
	            }else if(code != null){
	                return '<pre class="sh_markdown_multiline-code">```' + (code_type ? '<span class="sh_markdown_code-type">' + code_type + '</span>' : '') + '\n' + code + '```</pre>';
	            } else if(multiline_text) {
	            	let minLength_n = Math.min(multiline_text_open.length, multiline_text_close.length);
	            	let em_n = minLength_n % 2,
	            		strong_n = minLength_n >> 1,
						start_s = '*'.repeat(multiline_text_open.lengh - minLength_n) + '<em>'.repeat(em_n) + '<strong>'.repeat(strong_n),
	            		end_s = '</strong>'.repeat(strong_n) + '</em>'.repeat(em_n) + '*'.repeat(multiline_text_close.lengh - minLength_n);

	                return start_s + multiline_text_open + multiline_text + multiline_text_close + end_s;
	            } else {
	            	return $sub_s;
	            }
	        },
	    }
	};
});	

