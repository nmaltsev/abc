const $fs = require('fs');
const $path = require('path');

function readText(path_s, withPath=false) {
  return new Promise(function(res, rej){
    $fs.readFile(path_s, function(err, data){
      if (err) rej(err);
      else res(!withPath ? data.toString() : [data.toString(), path_s]);
    });
  });
}

function writeText(path_s, text_s) {
  return new Promise(function(res, rej){
    $fs.writeFile(path_s, text_s, function(err, data){
      if (err) rej(err);
      else res();
    });
  });
}

/**
 * getBasePath(['/aaa/bbb/ccc', '/aaa/bbb/ccc'])
 * @param {string[]} paths
 * @return {string | null}
 */
function getBasePath(paths_original) {
	let paths = paths_original.map(function(path){return path.replace(/\\/g, '/');});
	let paths_n = paths.length;
	let loop_b = true;
	let i_n;
	let basePath_s = null;
	let segment_s = '';
	let baseSegment_s;
	let pos_n;
	
	while (loop_b) {
		i_n = paths_n;
		baseSegment_s = null;
		while (i_n-- > 0) {
			pos_n = paths[i_n].indexOf('/');
			
			if (pos_n > -1) {
				segment_s = paths[i_n].substring(0, pos_n);
				paths[i_n] = paths[i_n].substring(pos_n + 1); 
			} else {
				// The last segment
				segment_s = paths[i_n];
				loop_b = false;
			}
			if (baseSegment_s === null) baseSegment_s = segment_s;
			if (baseSegment_s !== segment_s) {
				baseSegment_s = null;
				break;
			}
		}
		if (baseSegment_s !== null) {
			//console.log('BS [%s] (%s) BP [%s] (%s)', baseSegment_s, typeof(baseSegment_s), basePath_s, typeof(basePath_s));
			if (basePath_s == null) {
				basePath_s = baseSegment_s;
			} else {
				basePath_s += '/' + baseSegment_s; 
			}
		} else {
			break;
		}
	}
	return basePath_s;
}

/**
 * @param {string} path
 * @return {string}
 */
function normalizePath(path) {
  if (path.indexOf('/') === 0 || /^\w\:/.test(path)) return path;
  return $path.resolve(__dirname, path);
}

/**
	catchDependencies(`
		let r = require('../aa/BB/cc.js');
		var require = require("./path .js");
	`)
 * @param {string} source
 * @return {string[]}
 */
function catchDependencies(source) {
  let pattern = /require\((\'[\w\d\s\$\\\/\-_\+\.]+\'|\"[\w\d\s\$\\\/\-_\+\.]+\")\)/g;
  let match;
  let rawpath_s;
  const list = [];
  
  while (match = pattern.exec(source)) {
    rawpath_s = match[1].substr(1, match[1].length - 2);
    list.push(rawpath_s);
  }
  return list;
}

/**
 * @param {string} path_s
 * @return {string}
 */
function getDir(path_s) {
  return path_s.replace(/\/[\w\d\s\-._]+\.[\w\d]+$/g, '');
}

/**
 * @param {string} path_s
 * @param {string}
 */
function escapePath(path_s) {
  return path_s.replace(/\`|\'|\"|\n/g, '');
}

/**
 * for replacement without side effects  
 * https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/String/replace
 * @param {string} str_s
 * @param {string} pattern_s
 * @param {string} value_s
 */
function strictReplace(str_s, pattern_s, value_s) {
  let pos_n = str_s.indexOf(pattern_s);
  
  if (pos_n < 0) return str_s;
  return str_s.substring(0, pos_n) + value_s + str_s.substring(pos_n + pattern_s.length);
}

/**
 * for grouping an argument list `"test" -i "./path" -a "./path1" -a 2 -o "./path3" -r "./path4" -v`
 * @param {string[]} args
 * @return {{[string]:string[]}} arg2keys
 */
function groupArguments(args) {
  let arg2keys = {};
  let key_s, curKey_s;
  for(let i = 0; i < args.length; i++) {
    if (args[i].charAt(0) === '-') {
      key_s = args[i].substring(1);
      if (!Array.isArray(arg2keys[key_s])) arg2keys[key_s] = [];
    } else {
      curKey_s = key_s || 'default';
      if (!Array.isArray(arg2keys[curKey_s])) {
	arg2keys[curKey_s] = [];
      }
      arg2keys[curKey_s].push(args[i]);
    }
  }
  return arg2keys;
}

function head(list) {
  if (!Array.isArray(list)) return null;
  return list[0];
}

module.exports = {
  strictReplace,
  getBasePath,
  readText,
  getDir,
  catchDependencies,
  normalizePath,
  escapePath,
  groupArguments,
  head,
  writeText,
};
