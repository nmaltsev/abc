function span(className, textContent){
  return '<span class="' + className + '">' + textContent + '</span>';
}

module.exports = {
  js: {
    // todo test #private methods
    PATTERN: new RegExp(
      '' +
      '(\\%b\\d+b\\%)' + // @codeBlock
      '|' +
      '(//.*(?=[\\n]|$))|' + // a single line comment
      '(\\/\\*[\\s\\S]*?($|\\*\\/))|' + // a multiline comment
      // Attention: `.?` skips '\n' -> fixed by (*)
      '((?:\"[^\"\\\\]*(?:\\\\.?[^\"\\\\]*)*\")|(?:\'[^\'\\\\]*(?:\\\\.?[^\'\\\\]*)*\'))|' + // a single or double quote strings
      '(`[\\s\\S]+?`)|' + // multiline js strings
      '(' + // a regular expression literal 
        '(?:\\/[^\\s]+(?!\\\\)\\/)[img]{0,3}(?!\\d)(?=\\s*[\\;,\\x5d\\x29\\x2e\\n]?)' +
      ')|' +		
      '(function)(\\s*)([\\w\\d\\-\\_\\$]+)(\\s*\\()' + // a function name
      // Attention `constructor` is not a keyword
      '|(\\b(?:async|yield|await|try|catch|break|continue|do|in|else|for|if|return|while|with|switch|case|var|function|new|const|let|typeof|instanceof|throw|import|export|from|super|class|extends|static|this|delete|default)\\b)' + // @keywords
      '|(\\b(?:(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?)|(?:undefined|null|Infinity|NaN|true|false)\\b)|' + // a number 
      '(?:([@\\w\\$]+)(?=[(]))' + // function execution
      '|(\{|\})' // @figBrackets
      , 
    'g'),
    transformer: function(subStr, codeBlock, p1, p2, p2end, str1, str2, reg, funcDef, funcSplit, funcName, funcBrack, keywords, p6, method, figBrackets){
      if (codeBlock !== undefined) {
        // the DOM content must contain a code block identificator and be the same size as a corresponding model item
        return '<i class="sh-codeblock" data-id="' + codeBlock.substr(2, codeBlock.length - 4) + '"><span class="sh-codeblock_inner" contenteditable="false">' + codeBlock + '</span></i>';
      } else if (p1 !== undefined) {
        return span('sh_js_comment', subStr);
      } else if (p2 !== undefined) {
        return subStr.split('\n').map(function(str){return span('sh_js_comment sh_multiline', str);}).join('\n');
      } else if (str1 !== undefined || reg !== undefined) {
        let pos, prev = 0;
        
        while (pos !== -1){
          pos = subStr.indexOf('\n', prev);
          prev = pos + 1;
          if (subStr[pos - 1] !== '\\') {
            break;
          }
        }
        if (pos !== -1 ) {
          return span('sh_js_string', subStr.substring(0, pos)) + subStr.substring(pos);
        }
        return span('sh_js_string', subStr);
      } else if (str2 !== undefined) {
        return subStr.split('\n').map(function(str){return span('sh_js_string sh_multiline', str);}).join('\n');
      } else if (funcDef !== undefined) {	
        let s = span('sh_js_keyword', funcDef);

        if (funcSplit) {
          s += funcSplit;
        }
        if (funcName) {
          s += span('sh_js_func-name', funcName);
        }				
        if (funcBrack) {
          s += funcBrack; 
        }
        return s;
      } else if (keywords !== undefined) {
        return span('sh_js_keyword', subStr);
      } else if (p6 !== undefined) {
        return span('sh_js_number', subStr);
      } else if (method !== undefined){
        return span('sh_js_method', method);
      } else if (figBrackets !== undefined){
        return span('sh-js_brackets', figBrackets);
      }
    },
    commOpen: '//',
    commClose: ''
  },
  html: {
    ATTR: /([\w\d\-\:_]+)(?:(\s*=\s*)(\"[^\"]*\"|\'[^\']*\'|[^&\s]*))?/g,
    PATTERN: new RegExp(
      "(&lt;\\!\\[CDATA\\[[\\s\\S]*?\\]\\]&gt;)|(&lt;[!?][^&]+&gt;|&lt;\\!--[\\s\\S]+?--&gt;)|(&lt;/?[\\w\\-_:]*)" + // <![CDATA[<p>]]>, Comments(<!...>, <?...>) and tag name (<abc:x_y-z>)
      "((?:\\s+[\\w\\-:_]+(?:\\s*=\\s*(?:\"[\\s\\S]*?\"|'[\\s\\S]*?'|[^&\\s]*))?)*\\s*)" + // Attrribute
      "((?:/)?&gt;)?", 
    'g'),
    transformer:  function(subStr, cdata, comment, p1, p2, p3, p4, p5, p6){
      if (cdata) {
        return cdata.split('\n').map(function(str){return span('sh_html_cdata', str);}).join('\n');
      } 
      if (comment) {
        // @todo check if html comment can starts with multiline
        return '<span class="sh_html_comment">' + comment.replace(/\n/g, '</span>\n<span class="sh_html_comment sh_multiline">') + '</span>';
      }
      if (p1){
        let hstr = span('sh_html_tag', p1);
        
        if (p2) {
          let attr = p2.replace(this.ATTR, function(subStr, attr, sep, val){
            let res = '';

            if (attr) {
              res += span('sh_html_attr-name', attr);
            }
            if (sep) {
              res += sep;
            }
            if (val) {
              res += val.split('\n').map(function(str){return span('sh_html_attr-value', str);}).join('\n');
            }
            return res;
          });

          hstr += span('sh_html_attr-line', attr);
        }
        if (p3) {
          hstr += span('sh_html_tag', p3);
        }
        return hstr;
      }
    },
    commOpen: '<!--',
    commClose: '-->'
  },
  css: {
    PATTERN: new RegExp(
      '(\\/\\*[\\w\\W]*?\\*\\/)|([a-z\\-_]+)(?=\\s*\\:)|(\\#[abcdef0-9]{3,6})|([\\#\\.][_\\-a-z][\\w\\d\\-_]*)(?=\\s*[~>\\[\\{\\,\\+\\:]?)|(\\:{1,2}[\\a-z\\-_]+)(?=\\s|\\>|\\~|\\+|\\,|\\{)|(\"[^\"]*\"|\'[^\']*\')' +
      '|([\\w\\-\\_]+\\(|\\))',
      'ig'),
    transformer: function(subStr, comment, propertyName, hexColor, classSelector, pseudoclass, string, funcName, funcArg){
      if (comment) {
        return comment.split('\n').map(function(str){return span('sh_css_comment sh_multiline', str);}).join('\n');
      }
      if (classSelector) {
        return span('sh_css_class-selector', subStr);
      } else if (propertyName !== undefined) {
        return span('sh_css_property', subStr);
      } else if (hexColor !== undefined) {
        return '<span class="sh_css_hex-color">'  + '<i class="sh_css_color-mark" style="background:' + subStr + '"></i>' + subStr + '</span>';
      } else if (pseudoclass !== undefined) {
        return span('sh_css_pseudo', subStr);
      } else if (string !== undefined) {
        return span('sh_css_string', subStr);
      } else if (funcName != undefined) {
        return span('sh_css_func', funcName);
      }
    },
    commOpen: '/*',
    commClose: '*/'
  },
  gettext_po: {
    PATTERN: /(\#.*)|("[^"\\]*(?:\\.?[^"\\]*)*")|(\[\d*\])|(\b(?:msgctxt|msgid|msgid_plural|msgstr)\b)/ig,
    transformer: function(substr, comm, str, num, keyword){
      if (comm) {
        return span('sh_po_comment', comm);
      } else if (str) {
        return span('sh_po_string', str);
      } else if(num) {
        return span('sh_po_number', num);
      } else if (keyword) {
        return span('sh_po_keyword', keyword);
      }
    },
    commOpen: '#',
    commClose: ''
  },
  // ***\n - horizontal line (<hr/>) \n****\n
  markdown: {
    PATTERN: /\[([^\]]*)\]\(([^\)]*)\)|(\#+\s+)(.+)\n|```(.+)?\n([\s\S]*?)```|`(.*?)`|(\*+)([^*\n]+)(\*+)/ig, 
    transformer: function($sub_s, hyp_text, hyp_link, title_type, title_text, code_type, code, code_line, multiline_text_open, multiline_text, multiline_text_close, $pos){
      if (hyp_text != null) {
        return span('sh_markdown_hyptext', '[' + hyp_text + ']') + span('sh_markdown_hyplink', '(' + (hyp_link || '') + ')');
      } else if (title_type) {
        title_type = title_type.trim();
        return span('sh_markdown_title sh_markdown_titlesize' + title_type.length, title_type + '&nbsp;' + (title_text || '')) + '\n';
      } else if (typeof(code_line) == 'string'){ // fix empty string
        return '<i class="sh_markdown_code">`' + code_line + '`</i>';
      } else if (code != null){
        return '<pre class="sh_markdown_multiline-code">```' + 
          (code_type ? 
            span('sh_markdown_code-type', code_type) 
            : ''
          ) + 
          '\n' + code + '```</pre>';
      } else if (multiline_text) {
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
