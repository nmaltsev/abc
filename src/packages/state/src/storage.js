const {
  Action,
  GENERAL_ACTION,
} = require('./action');
const {
	cloneObject,
	cloneArray,
	isPrimitive,
	isObjectContainer
} = require('./deepClone');
const Event = require('./event');

class Storage extends Event {
  #attr = Object.create(null)
  constructor(initState) {
    super();
    if (initState) Object.assign(this.#attr, initState); 
  }
  
  /**
   * @param {Action} [action]
   * @param {(Action) => void} handler 
   */
  subscribe(){
    const action = arguments[0];
    this.on(action ? action.toString() : GENERAL_ACTION, arguments[1] || action);
  }
  
  /**
   * @param {string} propertyName
   * @param {(string, action, storage) => void}
   * @return {(string, action, storage) => void} handler
   */
  onChange(propertyName, handler) {
    this.on('change:' + propertyName, handler);
    return handler;
  }
  
  /**
   * @param {Action} action
   * @param {(Action) => void} handler 
   */
  unsubscribe(action, handler) {
    this.on(action ? action.toString() : GENERAL_ACTION, arguments[1] || action);
  }
  
  /**
   * @param {string} [property_s]
   * @return {Clone<Object>|string|number|boolean|undefined}
   */
  get(property_s) {
    if (!property_s) return cloneObject(this.#attr);
    const value = this.#attr[property_s];
    return isPrimitive(value) 
      ? value
      : cloneObject(value);
  }
  
  dispatch(action, force=false) {
    if (!(action.hasOwnProperty('type') && action.hasOwnProperty('value') && action.reduce)) return;
    const prev = {...this.#attr};
    this.#attr = action.reduce(this.#attr);
    // TODO before execute the action.thunk() method

    this.emit(action.toString(), action, this);
    
    if (!force && action.value) {
        for (let key_s in action.value) {
          if (
            prev[key_s] === action.value[key_s]
          ) continue;

          this.emit('change:' + key_s, this.#attr[key_s], action, this);
      }
    }
    
    // Notifies that the storage was changed
    if (action.toString() !== GENERAL_ACTION) this.emit(GENERAL_ACTION, new Action(), this); 
  }

  change(property_s, value) {
    this.#attr = {
      ...this.#attr,
      [property_s]: value,
    };
    
    if (this.#attr[property_s] === value) return;
    this.emit('change:' + property_s, this.#attr[property_s], null, this);
  }
}

module.exports = Storage;
