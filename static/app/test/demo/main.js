;DPROVIDER.define('main', ['TextFrame', 'SHighlighter', 'HighlighterSets'], function(TextFrame, SHighlighter, HighlighterSets){

	var tf = new TextFrame({
		cr: function(tagName){
			return document.createElement(tagName);
		},
		highlight: new SHighlighter(HighlighterSets.js)
	});
	console.dir(tf);

	document.body.appendChild(tf.el);
});

;DPROVIDER.require('main');
