class Event {
  #eventHandlers = Object.create(null)
  
  /**
   * @param {string} eventName
   * @param {function} handler 
   */
  on(eventName, handler){
    if (!Array.isArray(this.#eventHandlers[eventName])) this.#eventHandlers[eventName] = [];
    this.#eventHandlers[eventName].push(handler);
  }
  
  /**
   * @param {string} [eventName]
   * @param {function} [handler] 
   */
  off(eventName, handler) {
    if (handler) {
      const handlers = this.#eventHandlers[eventName];
      if (!Array.isArray(handlers)) return;
      let i = handlers.length - 1;
      
      while (i--> 0) {
        handlers.splice(i, 1);
      }
    } else if (eventName) {
      if (!Array.isArray(this.#eventHandlers[eventName])) return;
      this.#eventHandlers[eventName].length = 0;
    } else {
      this.#eventHandlers = Object.create(null);
    }
  }
  
  emit(action_s, value, payload, context) {
    if (!Array.isArray(this.#eventHandlers[action_s])) return;
    
    const handlers = this.#eventHandlers[action_s];
    for(let i = 0; i < handlers.length; i++) {
      handlers[i](value, payload, context);
    }
  }
  
  /**
   * @param {{[string]:function}} handlers_o
   * @param {boolean} [withDestructor]
   * @return {() => void | null}
   */
  listen(handlers_o, withDestructor=false) {
    const handlers = {};
    for (let key_s in handlers_o) {
      handlers[key_s] = this.on(key_s, handlers_o[key_s]);
    }
    
    return withDestructor ? () => {
      for (let key_s in handlers) {
        this.off(key_s, handlers[key_s]);
      }
    } : null;
  }
  
  once(eventName, handler){
    const _handler = (...args) => {
      this.off(name, _cb);
      return handler(...args);
    };
    this.on(eventName, _handler);
  }
}

module.exports = Event;
