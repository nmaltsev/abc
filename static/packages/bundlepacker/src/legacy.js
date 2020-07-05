/**
 * DEPRECATED
 * @param {string} root_s
 * @return {(string) => string}
 */
function resolvePath(root_s) {
	let currentRoot;
	
	if (currentRoot === '.') {
		currentRoot = __dirname;
	} else if (root_s.indexOf('./') === 0) {
		currentRoot = root_s.replace('./', __dirname + '/');
	} else {
		currentRoot = root_s
	}
	
	return function(path_s){
		let path;
		
		if (path_s.indexOf('./') === 0) {
			path = path_s.replace('./', __dirname + $path.sep);
		} else {
			path = $path.join(currentRoot, path_s);
		}
		return path;
	};
}

/**
 * DEPRECATED The manifest is useful for splitting packages on chanks
 * @param {string} manifestPath
 * @return {void}
 */
function handleManifest(manifestPath) {
	console.log('Manifest  %s', manifestPath);

	readText(manifestPath)
		.then(content => saveJSONParse(content))
		.then(manifest => {
			console.log('Manifest');
			console.dir(manifest);
			const promises = [];
			
			const  pathResolver = resolvePath(manifest.root);
			let filePath_s;
			
			for (let alias in manifest.aliases) {
				filePath_s = pathResolver(manifest.aliases[alias]);
				console.log('M %s', filePath_s);
				promises.push(
					readText(filePath_s)
					.then((source_s) => {
						// console.log('A %s %s', alias, source.length);
						return WRAPPER.replace('%s', source_s).replace('%s', alias);
					})
				);
			}
			filePath_s = pathResolver(manifest.index);
			console.log('Index %s', filePath_s);
			promises.push(
				readText(filePath_s)
				.then((source_s) => {
					// console.log('A %s %s', alias, source.length);
					return WRAPPER.replace('%s', source_s).replace('%s', 'index');
				})
			);
			
			Promise.all(promises).then((sources) => {
				$fs.writeFile(
					'out.js', 
					BUNDLE_INIT + '\n' + sources.join('\n'), 
					function(err){
						if (err) console.log('Cannot save the build');
					}
				);
			});
			
			
			
			// TODO 
			
		})
		.catch(e => {
			console.log('Error while parsing manifest file %s', manifestPath);
			console.dir(e);
		});

}

/**
 * @param {string} str
 * @return {Object}
 */
function saveJSONParse(str) {
	let cleanedContent = str
		.replace(/\/\/.*/g, '') // Fixing comments
		.replace(/,(\s*\})/g, function(_, match){return match;}); // fixing trailing comma
	
	return JSON.parse(cleanedContent);
}
