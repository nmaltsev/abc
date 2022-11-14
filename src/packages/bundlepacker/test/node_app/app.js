const $fs = require('fs');

function readText(path_s) {
  return new Promise(function(res, rej){
    $fs.readFile(path_s, function(err, data){
      if (err) rej(err);
      else res(data.toString());
    });
  });
}

module.exports = readText;
