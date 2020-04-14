function stringQuoting(quotaChar) {
  return function(self, posData){
    let text = self.el.textContent;
    let borders = self._getBordersOfContextLine(posData, text);
    let isQuoted = borders.fragment[0] === quotaChar;
    
    if (isQuoted) {
      borders.fragment = borders.fragment.substring(1, borders.fragment.length - 1);
    } else {
      borders.fragment = quotaChar + borders.fragment + quotaChar;
    }
    
    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  }
}

const KEY_BINDINGS = {
  'CTRL_SHIFT_D': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    return {
      text: text.slice(0, borders.start) + borders.fragment + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start + borders.fragment.length,
      end: borders.end + borders.fragment.length
    };
  },
  'ALT_L': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    borders.fragment = borders.fragment.toLowerCase();
    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start, 
      end: borders.start + borders.fragment.length
    };
  },
  'ALT_G': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    borders.fragment = borders.fragment.toUpperCase();
    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  'ALT_B': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    if (self._hooks.ALT_B) borders.fragment = self._hooks.ALT_B(borders.fragment);

    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  'ALT_U': function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    if(self._hooks.ALT_U) borders.fragment = self._hooks.ALT_U(borders.fragment);

    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  // Open all brackets in selected text
  ALT_O: function(self, posData){
    var 	text = self.el.textContent,
          borders = self._getBordersOfContextLine(posData, text);

    borders.fragment = self.model.getSource(borders.fragment);

    return {
      text: text.slice(0, borders.start) + borders.fragment + (text.slice(borders.end) || ''),
      start: borders.start,
      end: borders.start + borders.fragment.length
    };
  },
  'CTRL_SLASH': function(self, posData){
    if(self._hooks.CTRL_SLASH){
      var 	text = self.el.textContent,
            start = posData.end - posData.size;
            end = posData.end;

      if(text.charAt(end - 1) == '\n' && start != end) end--; // if range end on \n - cut it out
      if(text.charAt(start) == '\n' && start == end) start--;

      var 	topBorder = text.lastIndexOf('\n', start),
            bottomBorder = text.indexOf('\n',end),
            fragment;

      if (topBorder == -1) {
        topBorder = 0;	
      } else {
        topBorder++;	
      } 
      if (bottomBorder == -1) bottomBorder = text.length - 1;

      fragment = self._hooks.CTRL_SLASH(text.substring(topBorder, bottomBorder));

      return {
        text: (text.slice(0, topBorder) + fragment.text + text.slice(bottomBorder)),
        start: posData.size == 0 ? (posData.end + fragment.offset) : topBorder,
        end: posData.size == 0 ? (posData.end + fragment.offset) : (topBorder + fragment.text.length)
      };
    }
  },
  ALT_QUOTE: stringQuoting('\''),
  SHIFT_ALT_QUOTE: stringQuoting('\"'),
};

KEY_BINDINGS['CTRL_Z'] = function(self){
  console.log('UNDO');
  console.dir(self._history);

  var historyPoint = self._history.pop();

  // TODO first historyPoint unshift to `history redo list`
  // TODO add second List `redoList` at history



  if (historyPoint = self._history.pop()) { // second pop
    let 	sel = window.getSelection();

    console.log('historyPoint');
    console.dir(historyPoint);
    
    // TODO move current state at variant list (redo list for Ctrl-Y)
    // sel.removeAllRanges();
    // self.setText(historyPoint.text);
    // sel.addRange(self.createRange(self.el, historyPoint.start, historyPoint.end));
    return historyPoint;
  } else {
    console.warn('History is empty');
  }
};

KEY_BINDINGS['CTRL_Y'] = function(self){
  console.log('REDO');
  // TODO
};

module.exports = KEY_BINDINGS;
