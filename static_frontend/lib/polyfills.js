/*
focusin/out event polyfill (firefox) 
https://gist.github.com/nuxodin/9250e56a3ce6c0446efa
https://developer.mozilla.org/en-US/docs/Web/Events/focusin about FF support
*/
!function(){
    var     w = window, 
            d = w.document,
            isFF = typeof(InstallTrigger) !== 'undefined';

    // if( w.onfocusin === undefined ){
    if(isFF){
        d.addEventListener('focus'    ,addPolyfill    ,true);
        d.addEventListener('blur'     ,addPolyfill    ,true);
        d.addEventListener('focusin'  ,removePolyfill ,true);
        d.addEventListener('focusout' ,removePolyfill ,true);
    }  
    function addPolyfill(e){
        var type = e.type === 'focus' ? 'focusin' : 'focusout';
        var event = new CustomEvent(type, { bubbles:true, cancelable:false });
        event.c1Generated = true;
        e.target.dispatchEvent( event );
    }
    function removePolyfill(e){
        if(!e.c1Generated){ // focus after focusin, so chrome will the first time trigger tow times focusin
            d.removeEventListener('focus'    ,addPolyfill    ,true);
            d.removeEventListener('blur'     ,addPolyfill    ,true);
            d.removeEventListener('focusin'  ,removePolyfill ,true);
            d.removeEventListener('focusout' ,removePolyfill ,true);
        }
        setTimeout(function(){
            d.removeEventListener('focusin'  ,removePolyfill ,true);
            d.removeEventListener('focusout' ,removePolyfill ,true);
        });
    }
}();

if(!('remove' in Element.prototype)){
    Element.prototype.remove = function(){
        this.parentNode && this.parentNode.removeChild(this);
    };
}