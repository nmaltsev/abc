/* for JQuery style code */
;(function(env){
	function W($node){
		this.el = node;
		this._handlers = {};
	}
	W.prototype.on = function(event, handler){
		if(!Array.isArray(this._handlers[event])){
			this._handlers[event] = [];
		}
		
		var useCapture = false;

		if(this.isFF){
			if(event == 'focusin' ){ 
				event = 'focus';
				useCapture = true;			
			}else if(event == 'focusout'){
				event = 'blur';
				useCapture = true;
			}	
		}
		this.el.addEventListener(event, handler, useCapture); 
		this._handlers[event].push(handler, useCapture);
	}
	W.prototype.isFF = typeof(InstallTrigger) !== 'undefined';
	W.prototype.off = function(event, handler){
		if(Array.isArray(this._handlers[event])){
			var 	handlers = this._handlers[event],
					i;

			if(handler){
				i = handlers.indexOf(handler);

				if(i != -1){
					this.el.removeEventListener(event, handler, handlers[i + 1]); 
					handlers.splice(i, 2);	
				}
			}else{
				for(i = 0; i < handlers.length; i += 2){
					this.el.removeEventListener(event, handlers[i], handlers[i + 1]); 
				}
				handlers.length = 0;
			}
		}
	}
}(this));