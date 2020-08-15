/**
 * JS bundler 18
 * TODO Use static analyzer to build the BundlerCode
 * TODO Do not add any extensions if they are already defined ( require('./../../package.json'))
 */
const $path = require('path');

const DependencyScaner = require('./src/scaner');
const bundleGenerator = require('./src/bundle.generator');
const {groupArguments, head, writeText} = require('./src/utils');
const __version__ = '1';


/**
 * @param {string} rawPath_s
 * @param {string} [overridedBasePath_s] - local repository path
 * @param {string[]} [additionalResources] - collection of additional resources
 * @return {Promise<string>}
 */
function generateBundleCodeFromTargetFile(rawPath_s, overridedBasePath_s, additionalResources) {
  const targetPath_s = $path.resolve(rawPath_s).replace(/\\/g, '/');
  const localPackagePath_s = overridedBasePath_s && $path.resolve(overridedBasePath_s).replace(/\\/g, '/');
  const depScaner = new DependencyScaner(targetPath_s, localPackagePath_s);
  
  depScaner.addAdditionalResources(additionalResources);
  depScaner.onResource(resource => {
    // TODO hadle dynamic import
    if (resource.isDynamic) {
      console.log('IMPORT %s', relImportPath_s);
    }
  });
  
  return depScaner
    .directPropagation()
    .then(() => {
      // TODO after directPropagation(), it is possible to remove not founded depenedencies  
      const dependencyOrderList = depScaner.backPropagation();
      
      return bundleGenerator.generateBundleCodeFromFileList(dependencyOrderList, localPackagePath_s);
    })
    .catch(e => {
      return {
        code: '', 
        moduleErrors: [], 
      };
    })
    .then(out => {
      out.notFoundResources = depScaner._notFoundResources;
      return out;
    });
}

function analyzeEntryPoint(rawPath_s, overridedBasePath_s, additionalResources) {
  const targetPath_s = $path.resolve(rawPath_s).replace(/\\/g, '/');
  const localPackagePath_s = overridedBasePath_s && $path.resolve(overridedBasePath_s).replace(/\\/g, '/');
  const depScaner = new DependencyScaner(targetPath_s, localPackagePath_s);
  
  depScaner.addAdditionalResources(additionalResources);
  depScaner.onResource(resource => {
    // TODO hadle dynamic import
    if (resource.isDynamic) {
      console.log('IMPORT %s', relImportPath_s);
    }
  });

  return depScaner
    .directPropagation()
    .then(() => {
        const dependencyOrderList = depScaner.backPropagation();
        console.log('dependencyOrderList');
        console.dir(dependencyOrderList);
        console.log('Not found resources');
        console.dir(depScaner._notFoundResources);
    })
    .catch(e => {
      console.log('Not found resources');
      console.dir(depScaner._notFoundResources);
      console.dir(e);
    });
}

function showHelp(){
  console.log([
    '$: node bundler.js',
    '-i <index file path> - the bundle entry point',
    '-a <attached file path> - an additional file to be included in the bundle',
    '-b <local repository path> - redefined path to the local repository',
    '-r <report file path> - all compilation errors will be saved in this file',
    '-o <output file path> - path to the compiled bundle file',
    // TODO rewrite description
    '-d <index file path> - debug of entry point',
    'Example:',
    'node bundle.js -i ./index.js -o ./dist/output.js'
  ].join('\n'));
}

if (process.argv.length === 2) {
  showHelp();
} else {
  const evaluatedFlags = 'iabrod';
  const arg2keys = groupArguments(process.argv.splice(2));
  let flag_s;
  for (let i in evaluatedFlags) {
    flag_s = evaluatedFlags[i];
    if (!Array.isArray(arg2keys[flag_s])) continue;
    arg2keys[flag_s] = arg2keys[flag_s].map(path_s => $path.resolve(path_s).replace(/\\/g, '/')); 
  }

  if (arg2keys.d) {
    const entryPointPath = head(arg2keys.d);
    const localRepositoryPath = head(arg2keys.b);
    analyzeEntryPoint(entryPointPath, localRepositoryPath, arg2keys.a || [])
  } else {
    const entryPointPath = head(arg2keys.i);
    const localRepositoryPath = head(arg2keys.b);
    const outputPath = head(arg2keys.o);
    const reportPath = head(arg2keys.r);
    
    if (!entryPointPath || !outputPath) {
      console.warn('Not enough arguments');
      return;
    }
    
    generateBundleCodeFromTargetFile(entryPointPath, localRepositoryPath, arg2keys.a || [])
      .then(function(bundle){
        return Promise.all([
          writeText(outputPath, bundle.code),
          reportPath ? 
            writeText(reportPath, JSON.stringify({
                moduleErrors: bundle.moduleErrors,
                notFoundResources: bundle.notFoundResources
              }, null, '\t'))
            : Promise.resolve()
        ])
      });
  }
}
