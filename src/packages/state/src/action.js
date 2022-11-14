const GENERAL_ACTION = 'GENERAL';

class Action {
  /**
   * @param {string} type
   * @param {Object} [value]
   */
  constructor(type, value) {
    this.type = type ? (type + '').toUpperCase() : GENERAL_ACTION;
    this.value = value;
  }
  
  reduce(state) {
    if (!this.value) return state;
    return {
      ...state,
      ...this.value
    };
  }
  
  valueOf(){
    return this.type;
  }
}

module.exports = {
  Action,
  GENERAL_ACTION,
};
