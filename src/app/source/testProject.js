const ProjectModel = require('ProjectModel');
const DocumentModel = require('DocumentModel');

module.exports = function(){
  var projectModel = new ProjectModel({
    title: 'dev',
    opened_ids: ['0', '1', null, '3'],
    current_doc: '0', 
    docs: {},
  });
  projectModel.add([
    {
      title: 'index.html',
      mime: 'text/html',
      content:
        '<!DOCTYPE html>\n' +
        '<html>\n' +
        '	<head>\n' +
        '		<meta charset="utf-8">\n' +
        '		<link rel="stylesheet" type="text/css" href="./style.css"/>\n' +
        '	</head>\n' +
        '	<body>\n' +
        '		<h1 style="">Hello world!</h1>\n' +
        '		<script src="./script.js"></script>\n' +
        '	</body>\n' +
        '</html>\n'
    },
    {
      title: 'style.css',
      mime: 'text/css',
      content: 
        ':root{\n' +
        '	color: #cccccc;\n' +
        '}\n' +
        'html{ font: 13px/18px Arial; }	\n' +
        'body{ margin: 0; }\n' +
        'button, input{ font-family: inherit; }\n' +
        'table{ border-collapse: collapse; }\n' +
        '#id32:not(.abc){ \n' +
        '	width: calc(var(--abc) + 32px); \n' +
        '	margin: -1.31em; /* .25x desired size */ \n' +
        '	height: 5.24em;  /* 2x desired size */ \n' +
        '	width: 5.24em;   /* 2x desired size */ \n' +
        '	transform: scale(.5); \n' +
        '} \n' +
        ''
    },
    {
      title: 'script.js',
      mime: 'application/javascript',
      content: 
        '// single line comment\n' +
        'var lines = selectedText.split(\'\\n\').map(str => str.charCodeAt(0) == 9 ? str.substring(1) : str);\n' +
        '/* Double quoteas comment */ var str = "abc";/* multi\n' +
        '	line\n' +
        'comment	*/\n' +
        'var str = \'abc\';\n' +
        'var str = \'ab\\\n' +
        'c\';\n' +
        ''
    },
    {
      title: 'readme.txt',
      mime: 'text/plain',
      content: 'qwerty\nasdfghjkl\nzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnmzxcvbnm\n1234567890123456789012345678901234567890123456789012345678901234567890\n1234567890\n1234567890\n1234567890\n1234567890\n'
    },
    {
      title: 'test.xml',
      mime: 'text/xml',
      content: 
          '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"	xmlns:content="http://purl.org/rss/1.0/modules/content/"\n' +
        '	xmlns:wfw="http://wellformedweb.org/CommentAPI/"\n' +
        '	xmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
        '	xmlns:atom="http://www.w3.org/2005/Atom"\n' +
        '	xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n' +
        '	xmlns:slash="http://purl.org/rss/1.0/modules/slash/"\n' +
        '>\n' +
        '<channel>\n' +
        '	<title>Internship &#8211; French Tech Côte d&#039;Azur</title>\n' +
        '	<atom:link href="http://www.clubbusiness06.com/feed/" rel="self" type="application/rss+xml" />\n' +
        '	<description><![CDATA[<p>Vu sur <a rel="nofollow" href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">La Nuit des Associations, samedi 12 novembre 2016 \u00e0 Nice</a></p>\n' +
        '		<p style="font-size:14px; color:#666666; text-align:justify; font-family:Arial, Helvetica, sans-serif;font-weight:bold;">L\u2019engagement associatif est plus que jamais au c\u0153ur de nos pr\u00e9occupations. L\u2019Associatif Azur\u00e9en et ses partenaires s\u2019efforcent tous les ans de mettre en lumi\u00e8re les associations azur\u00e9ennes, leurs initiatives et leur \u0153uvre. <br />\n' +
        '		Pour atteindre cet objectif, l\u2019Associatif Azur\u00e9en, organisera cette ann\u00e9e, en collaboration avec L\u2019Ordre Associatif Mon\u00e9gasque, la 4\u00e8me NUIT DES ASSOCIATIONS, \u00e9dition C\u00f4te d\u2019Azur, le Samedi 12 Novembre 2016 au Palais de la M\u00e9diterran\u00e9e. Ce d\u00eener de gala, dont les b\u00e9n\u00e9fices seront redistribu\u00e9s aux associations azur\u00e9ennes, sera l\u2019occasion d\u2019honorer plusieurs b\u00e9n\u00e9voles, qui se verront remettre les m\u00e9dailles de l\u2019Ordre Associatif Mon\u00e9gasque, afin de r\u00e9compenser leur engagement. Lors de l\u2019\u00e9v\u00e9nement, le troph\u00e9e \u00ab Les Anges du Rocher \u00bb, oscar du secteur associatif, sera remis \u00e0 une association azur\u00e9enne, particuli\u00e8rement m\u00e9ritante, s\u00e9lectionn\u00e9e par notre comit\u00e9.</p>\n' +
        '		<p><a href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">Lire la suite <span class="meta-nav"></span></a></p>\n' +
        '		<p>Cet article <a rel="nofollow" href="http://www.clubbusiness06.com/nuit-des-associations-nice-121116/">La Nuit des Associations, samedi 12 novembre 2016 \u00e0 Nice</a> est apparu en premier sur <a rel="nofollow" href="http://www.clubbusiness06.com">CLUB BUSINESS 06</a>.</p>\n' +
        '	]]></description>\n' +
        '	<dc:creator><![CDATA[Emmanuel GAULIN]]></dc:creator>\n' +
        '	<category><![CDATA[2. Ev\u00e8nements du Club]]></category>\n' +
        '</channel>\n' +
        ''
    },
    {
      title: 'translate.po',
      mime: 'text/gettext',
      content: 
        'msgid ""\n' +
        'msgstr ""\n' +
        '	"Language: en_US\\n"\n' +
        '	"MIME-Version: 1.0\\n"\n' +
        '	"Content-Type: text/plain; charset=UTF-8\\n"\n' +
        '	"Content-Transfer-Encoding: 8bit\\n"\n' +
        '\n' +
        '# comment\n' +
        'msgctxt "license"\n' +
        'msgid "License"\n' +
        'msgstr "License"\n' +
        '\n' +
        'msgctxt "5_days_left"\n' +
        'msgid "1 day"\n' +
        'msgid_plural "%d day\\"newbie\\""\n' +
        'msgstr[0] "1 day"\n' +
        'msgstr[1] "%d days"\n' +
        ''
    },
    {
      title: 'data.json',
      mime: 'application/json',
      content: 
        '{"abc":"13","xyz":{"field1":"value1"}}\n' +
        '{"abc":"13","xyz":{"field1":"value1"}}\n' +
        '{"abc":"13","xyz":{"field1":"value1"}}' +
        ''
    },
    {
      title: 'test.md',
      mime: 'text/markdown',
      content: 
        'testtext\n' +
        '[emptylink]()\n' +
        '\n'+
        '[yandex](http://yandex.ru)\n' +
        '\n' +
        '# ng Bookdddstay\n' +
        'Stay on page 167\n' +
        '\n' +
        'text1  \n' +
        'text2  \n' +
        'text3\n' +
        '\n' +
        '\n' +
        '\n' +
        '\ttext\n' +
        ' \n' +
        'sss \n' +
        '\n' +
        '\n' +
        '# Helee\n' +
        '## loff\n' +
        'edwedwed\n' +
        '## sub title3\n' +
        'abcdefgh\n' +  
        'abcdefgh\n' +  
        '### edwedwedwe\n' +
        '\n' +
        'Example of command `ss	`fwewfw`sdd`dd`wdedwe` `` `--wswsed-`\n' +
        '---\n' +
        '\n' +
        '#### 1233\n' +
        'Example  \n' +
        '\n' +
        '```html\n' +
        '<!DOCTYPE html>\n' +
        '<html>\n' +
        '	<head>\n' +
        '		<meta charset="utf-8"/>\n' +
        '	</head>\n' +
        '	<body>\n' +
        '		<h2>Hello world!</h2>\n' +
        '	</body>\n' +
        '</html>\n' +
        '```\n' +
        'd ddwd\n' +
        '``` python\n' +
        'Code listening:\n' +
        '```\n' +
        '\n' +
        '```\n' +
        'edewd\n' +
        '```\n' +
        '\n' +
        'Text\n' +
        '**edwe\n' +
        'dw**\n' +
        '- abc;\n' +
        '- xyz;\n' +
        '- qwerty;\n' +
        '- 123. \n' + // this cose troubles
        '\n\n' +
        '1.	aaa;\n' +
        '2.	bbb;\n' +
        '3.	bbb;\n' +
        '4.	bbb;\n' +
        '\n\n' +
        '- abc;\n' +
        '- xyz;\n' +
        '	-	 qqq;\n' +
        '- qwerty;\n' +
        '\n' +
        '*11*\n' +
        '**22**\n' +
        '***33***\n' +
        '****44****\n' +
        '\n' +
        'another test text\n' +
        ''				
    },
    {
      title: 'blocks.js',
      mime: 'application/javascript',
      content: 
        'while(false){\n' +
        '	1;\n' +
        '}\n' +
        '{if(true){\n' +
        '\t11;\n' +
        '}\n' +
        '(function(){\n' +
        '\t1;\n' +
        '}())\n' +
        '}\n'
    }
  ].map((config) => new DocumentModel(config)));
  return projectModel;
};
