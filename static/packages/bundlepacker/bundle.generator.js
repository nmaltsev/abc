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
  _mergePaths,
  _path2id,
  _module2,
  _executeModule,
  _require2
} = require('./bundle.members');

// TODO implement with classes
const BUNDLE_INIT = `
;const _modules={}
;const _stack={}
;const _global=this
;const _dir=%dir%
;%methods%
`;

const MODULE_DEFINITION = ';_modules["<modid>"]=function(module, require){<code>}';
const BUNDLE_END = ';_executeModule("<modid>")';

/**
 * @param {string[]} bundleFiles
 * @return {Promise<string>} bundleCode
 */
function generateBundleCodeFromFileList(bundleFiles){
  let basePath = getBasePath(bundleFiles.map(function(path){return path.replace(/\\/g, '/');}));
	let bundleCode = '';
  let lastModule = '';
  const directoryMap = {};
	  
  return Promise.all(
		bundleFiles.map(function(path_s){return readText(path_s);})
	).then(function(sources){
		let bundleBody_s = sources.map(function(source_s, pos_n){
			let resourcePath = bundleFiles[pos_n];
      let modId = escapePath(resourcePath).replace(/\\/g, '/').replace(basePath, '').replace('.js', '');
      let dirPath = $path.dirname(resourcePath).replace(/\\/g, '/').replace(basePath, '');
      
      //~ console.log('R [%s] modId [%s]', resourcePath, modId);
      directoryMap[modId] = dirPath;
      lastModule = modId;
      
      return strictReplace(
        strictReplace(MODULE_DEFINITION, '<modid>', modId),
        '<code>', source_s
      );
    }).join('\n');
    bundleCode += BUNDLE_INIT
      .replace('%methods%', [
          _mergePaths, _path2id, _module2, _executeModule, _require2
        ].map((func) => func.toString()).join(';'))
      .replace('%dir%', JSON.stringify(directoryMap));
        
		bundleCode += bundleBody_s;
    bundleCode += BUNDLE_END.replace('<modid>', lastModule);
		return bundleCode;
	});
}

module.exports = {
  generateBundleCodeFromFileList
};
