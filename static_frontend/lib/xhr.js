//==================================
// Request
//==================================
{
	function Request(url, forceJSON){
		this.url = url;
		this.xhr = new XMLHttpRequest();
		this.xhr.onerror = function(e){
			this._onError && this._onError(this.xhr, e);
		}.bind(this);
		this.xhr.onreadystatechange = function(){
			if(this.xhr.readyState == 4){
				var 	contentType = this.xhr.getResponseHeader('Content-Type'),
						response = (this.JSON_MIME.test(contentType) && this.xhr.responseText || forceJSON) ? this._safeJSON(this.xhr.responseText) : this.xhr.responseText;

				if(this.xhr.status > 199 && this.xhr.status < 299 ){
					this._onComplete && this._onComplete(response, this.xhr);	
				}else{
					this._onError && this._onError(this.xhr);
				}
            }
        }.bind(this);
	};
	Request.prototype.JSON_MIME = /application\/json/;
	Request.prototype._safeJSON = function(text){
		try{
			return JSON.parse(text);
		}catch(e){
			return null;
		}
	};
	Request.prototype._exportHandlers = function(){
		var 	self = this;

		return {
			then: function(cb){
				self._onComplete = cb;
				return this;
			},
			catch: function(cb){
				self._onError = cb;
				return this;
			},
			getInstance: function(){
				return self.xhr;
			}
		}
	};
	Request.prototype._serialize = function(params, isJSON){
	    if(params){
	    	if(!isJSON){
	    		var 	urlencoded = [];
	        
				for(var key in params){
					params.hasOwnProperty(key) && urlencoded.push(key + "=" + encodeURIComponent(params[key]));
		        }
		        return urlencoded.join("&");
	    	}else{
	    		return JSON.stringify(params);
	    	}
	    }else{
	    	return '';
	    }
	};
	Request.prototype.get = function(data, contentType){
		var 	url = this._serialize(data);

		this.xhr.open('GET', this.url + (url ? '?' + url : url), true);
		contentType && this.xhr.setRequestHeader('content-type', contentType);
		this.xhr.send(null);

		return this._exportHandlers();
	};
	Request.prototype.post = function(data, contentType){
		this.xhr.open('POST', this.url, true);
		contentType && this.xhr.setRequestHeader('content-type', contentType);
		this.xhr.send(this._serialize(data, contentType == 'application/json'));

		return this._exportHandlers();
	};
}