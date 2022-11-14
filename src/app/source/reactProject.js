const ProjectModel = require('./ProjectModel');
const DocumentModel = require('./DocumentModel');


module.exports = function(){
  var projectModel = new ProjectModel({
      title: 'react app',
      opened_ids: Array(4),
      current_doc: undefined,
      docs: {},
  });
  projectModel.add([
    {
      title: 'index.html',
      mime: 'text/html',
      content: 
`<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<link rel="stylesheet" type="text/css" href="./style.css"/>
	</head>
	<body>
        <div id="root"></div>
        <script src="https://unpkg.com/react@17.0.1/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@17.0.1/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone@7.13.9/babel.min.js" charset="utf-8"></script>
        <script type="text/babel" src="./app.jsx">
        </script>
	</body>
</html>
`        
    },
    {
      title: 'style.css',
      mime: 'text/css',
      content: 
`html{ font: 13px/18px Arial; }
body{ margin: 0; }
button, input{ font-family: inherit; }
table{ border-collapse: collapse; }
`
        
    },
    {
      title: 'app.jsx',
      mime: 'application/javascript',
      content: 
`const App = (props) => <h1>Hello world!</h1>;

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
`
    },
  ].map((settings) => new DocumentModel(settings)));
  return projectModel;
};
