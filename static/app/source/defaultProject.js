const ProjectModel = require('./ProjectModel');
const DocumentModel = require('./DocumentModel');


module.exports = function(){
  var projectModel = new ProjectModel({
      title: 'default',
      opened_ids: Array(4),
      current_doc: undefined,
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
        '		<h1>Hello world!</h1>\n' +
        '		<script src="./script.js"></script>\n' +
        '	</body>\n' +
        '</html>\n'
    },
    {
      title: 'style.css',
      mime: 'text/css',
      content: 
        'html{ font: 13px/18px Arial; }	\n' +
        'body{ margin: 0; }\n' +
        'button, input{ font-family: inherit; }\n' +
        'table{ border-collapse: collapse; }\n'
    },
    {
      title: 'script.js',
      mime: 'application/javascript',
      content: ''
    },
    {
      title: 'readme.txt',
      mime: 'text/plain',
      content: ''
    },
  ].map((settings) => new DocumentModel(settings)));
  return projectModel;
};
