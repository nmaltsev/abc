//==========================================
// SyntaxHighlighter
//==========================================
function SHighlighter(conf){
	this.pattern = conf.PATTERN;
	this.transformer = conf.transformer.bind(conf);
}
SHighlighter.prototype.htmlspecialchars = function(str){
	return str ? str.replace(/[<>&]/g, function(m){
		return m == '<' ? '&lt;' : m == '>' ? '&gt;' : '&amp;'
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

var HighlighterSets = {
	js: {
		PATTERN: new RegExp(
			"(//.*(?=[\\n]|$))|" + // single line comment
			'(\\/\\*[\\s\\S]*?($|\\*\\/))|' + // multiline comment
			// '((?:\"[^\"\\\\]*(?:\\\\.[^\"\\\\]*)*\")|(?:\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'))|' + // single or double quote strings
			// Attention: `.?` skip '\n' so it fix by (*)
			'((?:\"[^\"\\\\]*(?:\\\\.?[^\"\\\\]*)*\")|(?:\'[^\'\\\\]*(?:\\\\.?[^\'\\\\]*)*\'))|' + // single or double quote strings
			'(`[\\s\\S]+?`)|' + // multiline js strings
			'(' + // regular expression literal 
				'(?:\\/[^\\s]+(?!\\\\)\\/)[img]{0,3}(?!\\d)(?=\\s*[\\;,\\x5d\\x29\\x2e\\n]?)' +
			')|' +		
			// '(?:(?=function\\s*)([\\w\\d\\-\\_\\$]+)(?=\\s*\\())|' + // function name
			'(function)(\\s*)([\\w\\d\\-\\_\\$]+)(\\s*\\()|' + // function name
			"(\\b(?:break|continue|do|in|else|for|if|return|while|var|function|new|const|let|true|false)\\b)|" + // keywords
			"(\\b(?:(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?)|(?:undefined|null)\\b)|" + // numbers
			// "(?:[.]([\\w]+)(?=[(]))", // methods
			"(?:\\.([\\w]+)(?=[(]))|" + // method chaining
			"(?:\\b([\\w]+)(?=[(]))", // function execution
		'g'),
		transformer: function(subStr, p1, p2, p2end, str1, str2, reg, funcDef, funcSplit, funcName, funcBrack, keywords, p6, method, funcExc){
			if(p1 != undefined){
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
			}else if(method != undefined){
				return '.<span class="sh_js_method">' + method + '</span>';
			}else if(funcExc != undefined){
				return '<span class="sh_js_method">' + funcExc + '</span>';
			}
		},
	},
	html: {
		ATTR: /([\w\d\-\:_]+)(\s*=\s*)?(\"[^\"]*\"|\'[^\']*\'|[^&\s]*)?/g,
		PATTERN: new RegExp(
			"(&lt;\\!\\[CDATA\\[[\\s\\S]*?\\]\\]&gt;)|(&lt;[!?][^&]+&gt;|&lt;\\!--[\\s\\S]+?--&gt;)|(&lt;(?:/)?(?:[\\w\\-_:]+))" + // <![CDATA[<p>]]>, Comments(<!...>, <?...>) and tag name (<abc:x_y-z>)
			// "((?:\\s+[\\w\-_]+(?:\\s*=\\s*(?:\".*?\"|'.*?'|[^&\\s]+))?)*\\s*)" +
			"((?:\\s+[\\w\\-:_]+(?:\\s*=\\s*(?:\"[\\s\\S]*?\"|'[\\s\\S]*?'|[^&\\s]*))?)*\\s*)" + // Attrribute
			"((?:/)?&gt;)", 
		'g'),
		transformer:  function(subStr, cdata, comment, p1, p2, p3, p4, p5, p6){
			if(cdata){
				return '<span class="sh_html_cdata">' + cdata.replace(/\n/g, '</span>\n<span class="sh_html_cdata">') + '</span>';
			} 
			if(comment){
				return '<span class="sh_html_comment">' + comment.replace(/\n/g, '</span>\n<span class="sh_html_comment sh_multiline">') + '</span>';
			}
			if(p1 != undefined && p3 != undefined){
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
					// hstr += '<span class="sh_html_attr-line">' + p2 + '</span>';
				}
				hstr += '<span class="sh_html_tag">' + p3 + '</span>';
				return hstr;
			}
		}
	},
	css: {
		// PATTERN: /(\/\*[\w\W]+?\*\/)|([a-z\-_]+)(?=\s*\:)|(\#[abcdef0-9]{3,6})|([\#\.][\w\d\-_]+)(?=\s*[~>\[\{\,\+\:]?)|(\:{1,2}[\a-z\-_]+)(?=\s|\>|\~|\+|\{)|(\"[^\"]*\"|\'[^\']*\')/g,
		PATTERN: new RegExp(
			'(\\/\\*[\\w\\W]+?\\*\\/)|([a-z\\-_]+)(?=\\s*\\:)|(\\#[abcdef0-9]{3,6})|([\\#\\.][a-z][\\w\\d\\-_]*)(?=\\s*[~>\\[\\{\\,\\+\\:]?)|(\\:{1,2}[\\a-z\\-_]+)(?=\\s|\\>|\\~|\\+|\\{)|(\"[^\"]*\"|\'[^\']*\')' +
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
		}
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

		}
	}
}