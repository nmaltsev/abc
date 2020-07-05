const BUNDLE_CLASS = class{
  constructor(modules, environment, dir, localRepo){
    this._modules = modules;
    this._stack = {};
    this._global = environment;
    this._dir = dir;
    this._localRepo = localRepo;
  }
  _executeModule(moduleId){
    const modId = this.constructor._path2id(moduleId);
    
    if (this._stack.hasOwnProperty(modId)) this._stack[modId]();
    if (!this._modules.hasOwnProperty(modId)) {
      throw('Dependency "%s" was not resolved'.replace('%s', modId));
    } else {
      /* _global is a scope (window or global) */
      this._modules[modId].call(this._global, this.$module(modId), this.$require(this._dir[modId], this._localRepo));
    }
    
    return this._stack[modId]();
  }
  $require = (basePath, localRepositoryPath) => {
    return moduleId_s => {
      const moduleId = this.constructor._mergePaths(basePath, moduleId_s, localRepositoryPath);
      const r = this._executeModule(moduleId);
      return r;
    };
  }
  $module = (path_s) =>{
    const out = {exports:{}};
    this._stack[this.constructor._path2id(path_s)] = function(){return out.exports;};
    return out; 
  } 
  static _path2id(path_s){
    return path_s.replace(/.js$/i,'');
  }
  /**
   * _mergePaths('/aaa/bbb/ccc/ddd/333', '../../eee')
   * The method should handle: `./aaa` `./../../aaa` `../../aaa` 
   * @param {string} basePath_s
   * @param {string} path_s
   * @param {string} overridedBasePath_s
   * @return {string | null} returns null in case violation of the root folder limit
   */
  static _mergePaths(basePath_s, path_s, overridedBasePath_s) {
    if (path_s.indexOf('/') === 0 || /^\w\:/.test(path_s)) return path_s;
    /* for compatibility with npm packages */
    if (overridedBasePath_s && path_s[0] !== '.') {
      return overridedBasePath_s + '/' + path_s;
    }
    
    const paths = path_s.split('/');
    const bases = basePath_s.split('/');
    if (paths[0] === '.') paths.shift(); 
    let i = 0; /* skipped parents folder counter */

    while (i < paths.length) {
      if (paths[i] === '.') j++;
      if (paths[i] !== '..') break;
      i++;
    }
    /* when the path exits the root folder */
    if (i > bases.length) return null;
    return bases.slice(0, i > 0 ? -i : bases.length).concat(paths.slice(i)).join('/');
  }
}

module.exports = {
  BUNDLE_CLASS,
};
