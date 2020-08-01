const BacksideView = require('../../packages/backside/view');

class JsConsole extends BacksideView {
	/**
	 * @param {Backside.Model} conf.appModel
	 * @param {Backside.Model} conf.docModel
	 */
	constructor(conf) {
		super(conf);
		this.appModel = conf.appModel;
	}

	initialize(conf) {
		super.initialize(conf);
		this.el.style.display = 'none';
		this._stopEventsListeners = this._prebindEvents();
		this.model.listen({
			'closePresentation': (m) => {
				this.appModel.closeSpace(m.getPresentationID());
				this.el.remove();
			},
			'destroy': (m) => {
				this._stopEventsListeners();
				this.remove();
			},
			'reloadMainFrame': (m) => {
				this.refresh();
			},
			'change:title': (title, m) => {
				this.controls.header.textContent = title;
			},
	    });

		this.controls.frame.onload = function(e){
			this.updateContent(e.target.contentDocument, this.model.getSource());
		}.bind(this);
		this.controls.frame.onerror = function(e){
			console.log('Frame error');
			console.dir(e);
		};
	}
	
  refresh() { // send reference on application
		var 	source = this.model.getSource();

		this.controls.frame.contentWindow.location.reload();
		this.controls.header.textContent = this.model.get('title');
	}
	
  updateContent(doc, source) {
		doc.open();
		doc.write('<html><head>');
		doc.write('<style>html{font:13px/15px Arial;color:#333;}body{margin:0;}p{margin:0 0 8px 0;}.object-container{padding:0 0 0 10px;background:#daf1cb;font-size:12px;line-height:12px;}.object-container p{margin:0 0 0 10px;}.message-error{background:#ffddcf;}</style>');
		doc.write('<script>' + this.injectCode + '</script>');
		doc.write('</head><body>');

		// TODO:
		// 	(new Function('alert(1')).toString()
		
		let func;
		let compilationError;
		try {
			func = new Function(source);
		} catch(e) {
			compilationError = e.toString();
		}

		if (compilationError) {
			doc.write('<script>console._reportError(`' + compilationError + '`)</script>');
			
		} 
		else {
			// The try block can catch ReferenceError
			doc.write('<script>try{(' + func + '())}catch(e){_console.dir(e);_console.log(e.toString());console._reportError(e.stack)}</script>');
		}
	
		doc.write('</body></html>');
		doc.close();
	}
}
JsConsole.prototype.className = 'sc_frame-wrap';
JsConsole.prototype.template = 
	'<iframe class="sc_code-frame" data-co="frame"></iframe>' +
	'<div class="sc_edit-header">' +
		'<h3 class="sc_edit_doctitle" data-co="header"></h3>' +
		'<button class="sc_btn sc_edit-close-btn" data-co="close">&#10005;</button>' + 
		'<button class="sc_btn sc_edit-reload-btn" data-co="reload">&#8634;</button>' +
		'<button class="sc_btn sc_edit-separate-btn" data-co="separate">&#11036;</button>' +
	'</div>';
JsConsole.prototype.injectCode =
`;(function(E){
	const ESCAPE_MAP = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;'
		};
	const UNESCAPE_MAP = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#x27;': "'"
	};

	const _console = E.console;

	function escape(str){
		return (str && str.replace) ? str.replace(/[<>&"']/g, function(m){
			return ESCAPE_MAP[m];
		}) : '';
	};
	function unescape(str){
		return str.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;)/g, function(m){
			return UNESCAPE_MAP[m];
		});
	};
	
	
	E.abc = {
		load: async function(url_s) {
			return new Promise(function(res, rej){
					let $script = document.createElement('script');
					$script.setAttribute('src', url_s);
					$script.onload = function(){
						res();
					};
					$script.onerror = function(){
						rej();
					};
					
					if(document.readyState != 'complete') {
						document.onreadystatechange = function(){
							if(document.readyState == 'complete'){
								document.body.appendChild($script);
							}
						};
					} else {
						document.body.appendChild($script);
					}
			});
		}
	};
	E._console = _console;

	function object2string(o) {
		//_console.dir(o);
		let s = '<div class="object-container">';
		s += _object2string(o);
		s += '</div>';
		return s;
	}
	function _object2string(o) {
		if (typeof(o) === 'object' && o &&
			(o.constructor === Object || o.constructor === Map || o.constructor === Set || Array.isArray(o))
		) {
			//_console.dir(o);
			let s = '<b>{</b>';
			let descriptors = Object.getOwnPropertyDescriptors(o);
			let value;
			let property;
			
			for (property in descriptors) {
				value = descriptors[property].value;
				if (typeof(value) === 'object' && value.constructor === Object) {
					s += '<p>' + escape(property) + ':</p>';
					s += object2string(value);
				} else {
					s += '<p source="descr">' + escape(property) + ': ' + _object2string(value) + '</p>';
				}
			}
			
			
			if (o[Symbol.iterator] && !Array.isArray(o)){
				for (property of o[Symbol.iterator]()) 
					s += '<p source="iter">' + _object2string(property) + '</p>';
			}
			
			if (Object.getPrototypeOf(o)) {
				s += '<p>prototype: ' + Object.getPrototypeOf(Object.create(o)).constructor.name + '</p>';
			}
			
			s += '<b>}</b>';
			
			return s;
		} else {
			if (typeof(o) == 'string') return '"' + escape(o + '') + '"';
			return escape(o + ''); // "+" converts all types to string!
		}
	}

	
	
	E.console = {
		log: function(a0, ...args){
			var 	len = args.length;
			var 	s = a0 + '';

			_console.dir(s);
			_console.dir(args);
			
			
			if(len > 0){
				for(var i = 0; i < len; i++){
					s = s.replace('%s', args[i]);
				}
			}else{
				s += ''; // Converting to string
			}
			let $n = document.createElement('p');
			$n.innerHTML = escape(s).replace(/\\n/g, '<br/>&#8203;')
			document.body.appendChild($n);

		},
		dir: function(o){
			let $n = document.createElement('div');
			$n.className = 'object-container';
			$n.innerHTML = _object2string(o);
			document.body.appendChild($n);
		},
		clear: function(){
			document.body.innerHTML = '';
		},
		_reportError: function(message){
			let $n = document.createElement('p');
			$n.className = 'message-error';
			$n.innerHTML = escape(message).replace(/\\n/g, '<br/>&#8203;');
			document.body.appendChild($n);
		}
	};
	E.onerror = function(e, s, line, position, error){
		console._reportError(e.stack + ' ' + line + ':' + position);
		_console.log('Catch error');
		_console.dir(arguments);
	};
	E.addEventListener('unhandledrejection', function(e) {
		console._reportError(e.reason.stack + '');
		_console.log('Promise exception');
		_console.dir(e);
		_console.dir(e.reason +'');
	});
	
}(window));`;
JsConsole.prototype.events = {
  'onclick close': function(){
    this.model.trigger('closePresentation', this.model);
  },
  'onclick reload': function(){
    this.refresh();
  },
  'onload frame': function(e){
    this.controls.header.textContent = this.controls.frame.contentDocument.title
  },
  'onclick separate': function(e){ // create independent instance of page
    // TODO need new code
    
    // var 	urlOnDoc = URL.createObjectURL(new Blob([this.html], {type: 'text/html'}));
    // window.open(urlOnDoc, '_blank');
  },
};

module.exports = JsConsole;
