var $helpers = {
	debounce: function(func, wait, immediate){
		var _timeout;
		return function() {
			var 	context = this, 
						args = arguments,
						later = function() {
							_timeout = null;
							if(!immediate){
								func.apply(context, args);	
							} 
						},
						callNow = immediate && !_timeout;

			clearTimeout(_timeout);
			_timeout = setTimeout(later, wait);
			
			if(callNow){
				func.apply(context, args);	
			} 
		};
	},
	escapeMap: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;'
	},
	unescapeMap: {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#x27;': "'"
	},
	escape: function(str){
		return str ? str.replace(/[<>&"']/g, function(m){
			return this.escapeMap[m];
		}.bind(this)) : '';
	},
	unescape: function(str){
		return str.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;)/g, function(m){
			return this.unescapeMap[m];
		}.bind(this));
	},
	supplant: function(template, o){
		return template.replace(/{([^{}]*)}/g, function(a, b){
			var r = (b[0] == '=') ? $helpers.escape(o[b.substring(1)]) : o[b];
			return r != null ? r : '';
		});
	},
	// Used only at syntaxis higlighter
	htmlspecialchars: function(str){
		return str ? str.replace(/[<>&]/g, function(m){
			return this.escapeMap[m];
		}.bind(this)) : '';
	},
  parseQuery: function(query){
    var 	parts = (query || window.location.search.substr(1)).split('&'),
					pos, key, value,
					i = parts.length,
					out = Object.create(null);

    while(i-- > 0){
      key = parts[i];
      pos = key.indexOf('=');

      if(pos != -1){
        value = key.substr(pos + 1);
        key = key.substr(0, pos);
      }else{
        value = null;
      }
      out[key] = value;
    }
    return out;
  },
  saveParse: function(str){
    try{return JSON.parse(str);}catch(e){}
  },
};

module.exports = $helpers;
