function SHighlighter(conf){
  this.pattern = conf.PATTERN;
  this.transformer = conf.transformer.bind(conf);
  this.commOpen = conf.commOpen;
  this.commClose = conf.commClose;
}

SHighlighter.prototype.htmlspecialchars = function(str){
  return str ? str.replace(/[<>&]/g, function(m){
    return m == '<' ? '&lt;' : m == '>' ? '&gt;' : '&amp;';
  }) : '';
};

SHighlighter.prototype.prettify = function(str){
  return this
    .htmlspecialchars(str)
    .replace(this.pattern, this.transformer);
};
  
module.exports =  SHighlighter;
