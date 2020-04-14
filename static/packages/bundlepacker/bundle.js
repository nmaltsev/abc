/**
 * JS bundler 12
 * node bundle.js enum.js enum_test.js > enum.bundle.js; nodejs enum.bundle.js
 * node bundle.js index.js
 * TODO Use static analyzer to build the BundlerCode
 */
const $path = require('path');

const DependencyScaner = require('./scaner');
const bundleGenerator = require('./bundle.generator');
const __version__ = '1';

/**
 * @param {string} rawPath_s
 * @return {Promise<string>}
 */
function generateBundleCodeFromTargetFile(rawPath_s) {
  const targetPath_s = $path.resolve(rawPath_s).replace(/\\/g, '/');
  const depScaner = new DependencyScaner(targetPath_s);

  return depScaner
    .directPropagation()
    .then(() => {
        const dependencyOrder = depScaner.backPropagation();
        return bundleGenerator.generateBundleCodeFromFileList(dependencyOrder);
    })
}

if (process.argv.length === 3 && process.argv[2].includes('.js')) {
	generateBundleCodeFromTargetFile(process.argv[2])
    .then(function(bundleCode){
      console.log(bundleCode);
    });
} else if (process.argv.length > 2) {
  let affectedFiles = process.argv.slice(2).map((rawPath) => $path.resolve(rawPath).replace(/\\/g, '/'));
  bundleGenerator.generateBundleCodeFromFileList(affectedFiles)
		.then((bundleCode) => {
			console.log(bundleCode);
		});
} else {
	console.log('$: node bundle.js file1.js file2.js > file.bundle.js && nodejs file.bundle.js\n\
$: node bundle.js script.js');
}
