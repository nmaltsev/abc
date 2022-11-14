const $path = require('path');
const {
  strictReplace,
  getBasePath,
  readText,
  getDir,
  catchDependencies,
  normalizePath,
  escapePath
} = require('./utils');
const {
  BUNDLE_CLASS,
} = require('./bundle.members');

const BUNDLE_INIT = `(new(%BODY%)(%ARGS%))._executeModule(%LASTMOD%);`;

/**
 * @param {string[]} bundleFiles
 * @param {string} [localPackagePath_s]
 * @return {Promise<{code:string, errors:Object[]}>}
 */
function generateBundleCodeFromFileList(bundleFiles, localPackagePath_s){
  let basePath = getBasePath(bundleFiles.map(function(path){return path.replace(/\\/g, '/');}));
  let lastModule = '';
  const directoryMap = {};
  const moduleErrors = [];
	  
  return Promise.all(
    bundleFiles.map(function(path_s){
      return readText(path_s).catch(e => null);
    })
  ).then(function(sources){
    let modules_s = sources.map(function(source_s, pos_n){
      // The purpose of this function is to serialize the module 
      if (!source_s) {
        console.log('SKIP module');
        console.dir([bundleFiles[pos_n]]);
        return;
      }
      let resourcePath = bundleFiles[pos_n];
      let modId = escapePath(resourcePath).replace(/\\/g, '/').replace(basePath, '').replace(/\.js$/i, '');
      let dirPath = $path.dirname(resourcePath).replace(/\\/g, '/').replace(basePath, '');
      // console.log('R [%s] modId [%s]', resourcePath, modId);
      directoryMap[modId] = dirPath;
      lastModule = modId;
      let func_s = 'function(){}';

      if (modId.endsWith('.json')) {
        // "id":<serialized JSON object>
        // console.log('JSON %s (%s)', source_s, typeof(source_s));
        try {
          return JSON.stringify(modId) + ':' + JSON.stringify(JSON.parse(source_s));
        } catch (error) {
          moduleErrors.push({
            resource: resourcePath,
            error: error.toString()
          });
        }
      }
      
      try {
        // Attention: Don't use the .replace() method on source_s variable. Use only the strictReplace() function!
        // TODO add code minification
        let func = new Function('module', 'require', source_s);
        func_s = func.toString();
      } catch (error) {
        moduleErrors.push({
          resource: resourcePath,
          error: error.toString()
        });
      }
      // "id":<function source code> 
      // TODO add a commnet why I use JSON.stringify() for serialization identifiers
      return JSON.stringify(modId) + ':' + func_s;
    })
      .filter(s => !!s)
      .join(',');
    
    // console.log('lastModule %s', lastModule);
    
    // String.prototype.replace() handles `$` symbols in the code that can cause runtime errors!
    let bundleCode = strictReplace(
        strictReplace(
          strictReplace(
            BUNDLE_INIT,
            '%BODY%', 
            BUNDLE_CLASS
              .toString()
              .replace(/\/\*[\w\W]*?\*\//g, '')
          ),
          '%LASTMOD%', 
            // TODO explain why JSON.stringify is used to serialise the path
          JSON.stringify(lastModule)
        ),
        '%ARGS%',
        [
          '{' + modules_s + '}',
          'this',
          JSON.stringify(directoryMap),
          JSON.stringify(localPackagePath_s || '').replace(basePath, '')
        ].join(',')
      );

    return {
      code: bundleCode,
      moduleErrors: moduleErrors
    }
	});
}

module.exports = {
  generateBundleCodeFromFileList
};
