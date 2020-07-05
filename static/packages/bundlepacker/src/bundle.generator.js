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
    bundleFiles.map(function(path_s){return readText(path_s);})
  ).then(function(sources){
    let modules_s = sources.map(function(source_s, pos_n){
      let resourcePath = bundleFiles[pos_n];
      let modId = escapePath(resourcePath).replace(/\\/g, '/').replace(basePath, '').replace('.js', '');
      let dirPath = $path.dirname(resourcePath).replace(/\\/g, '/').replace(basePath, '');
      //~ console.log('R [%s] modId [%s]', resourcePath, modId);
      directoryMap[modId] = dirPath;
      lastModule = modId;
      let func_s = 'function(){}';
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
      return JSON.stringify(modId) + ':' + func_s;
    }).join(',');
    
    //~ console.log('lastModule %s', lastModule);
    
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
