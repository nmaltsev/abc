/**
 * _mergePaths('/aaa/bbb/ccc/ddd/333', '../../eee')
 * @param {string} basePath_s
 * @param {string} path_s
 * @return {string | null} returns null in case violation of the root folder limit
 */
function _mergePaths(basePath_s, path_s) {
	if (path_s.indexOf('/') === 0 || /^\w\:/.test(path_s)) return path_s;
	if (path_s.indexOf('./') === 0) return basePath_s + '/' + path_s.substring(2);
	const paths = path_s.split('/');
	const bases = basePath_s.split('/');
	let i = 0;
	while (i < paths.length) {
		if (paths[i] != '..') break;
		i++;
	}
	if (i > bases.length) return null;
	return bases.slice(0, i > 0 ? -i : bases.length).concat(paths.slice(i)).join('/');
}

function _path2id(path_s){
	return path_s.replace(/.js$/i,'');
}

function _module2(path_s){
	const out = {exports:{}};
	_stack[_path2id(path_s)] = function(){ return out.exports; };
	
	return out; 
}

function _executeModule(moduleId) {
  const modId = _path2id(moduleId);
  
  if (!_stack.hasOwnProperty(modId)) {
      if (!_modules.hasOwnProperty(modId)) {
        throw('Dependency "%s" was not resolved'.replace('%s', modId));
      } else {
        // _global is a scope (window or global)
        _modules[modId].call(_global, _module2(modId),_require2(_dir[modId]));
      }
  }
  return _stack[modId]();
}

// Improvement: I can store the basePath in another hash map
function _require2(basePath){
	return function(moduleId_s) {
		let moduleId = _mergePaths(basePath, moduleId_s);
    let r = _executeModule(moduleId);
    return r;
	};
}

module.exports = {
  _mergePaths,
  _path2id,
  _module2,
  _executeModule,
  _require2
};
