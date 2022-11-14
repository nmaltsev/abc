function downloadFileFromText(filename, content) {
  var 	a = document.createElement('a'),
      blob = new Blob([content], {type : "text/plain;charset=UTF-8"});

  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  delete a;
}
module.exports = downloadFileFromText;
