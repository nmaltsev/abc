console.log('start');
let code = `
var str = 'abc\\'sdsfsf';
var str = 'ecee
cec'; eddwe'
999 let abc='wwww`;
const rules = require('./rules').js;

function codeRunner(code, rules) {
  let p = 0;
  let len = code.length;
  let char;
  let rule;
  let activeBlock;
  let releaseStack = [];
  let notRecognizedStart = 0;
  
  while (p < len){
    char = code[p++]; // char is equal to code[p-1]
    
    if (activeBlock) {
      // Processing chars that belong to the activeBlock
      if (
        (char === activeBlock.rule.close && code[p-2] !== activeBlock.rule.escape)
        || (activeBlock.rule.prohibited ? char === activeBlock.rule.prohibited : true)
      ) {
        activeBlock.end = p-1;
        activeBlock.body = code.substring(activeBlock.start, activeBlock.end);
        notRecognizedStart = p;
        activeBlock = null;
      }
    } else {
      // Processing not recognized symbols
      if (char in rules) {
        if (rules[char].type === 'block') {
          releaseStack.push(code.substring(notRecognizedStart, p-1));
          activeBlock = {
            start: p,
            rule: rules[char],
          }
          releaseStack.push(activeBlock);
        } else {
          // todo scan recursivly!
          // code[p] - next char!
        }
      } else {
        //~ console.log('NR %s', char);
      }
    }
  }
  if (activeBlock) {
    activeBlock.end = len-1;
    activeBlock.body = code.substring(activeBlock.start, activeBlock.end);
  } else {
    releaseStack.push(code.substring(notRecognizedStart, len-1));
  }
  
  console.log('releaseStack');
  console.dir(releaseStack);
}

codeRunner(code, rules);
