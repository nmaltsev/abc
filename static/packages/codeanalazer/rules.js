module.exports = {
  // todo rename 'onchar'
    js: {
      '\'': {
          type: 'block',
          prohibited: '\n',
          close: '\'',
          escape: '\\',
          id: 'string-literal-1'
      },
      '\"': {
          type: 'block',
          prohibited: '\n',
          close: '"',
          escape: '\\',
          id: 'string-literal-2'
      },
      '`': {
          type: 'block',
          close: '`',
          escape: '\\',
          id: 'string-literal-3'
      },
      '/': {
        '*': {
          type: 'block',
          end: '*/',
          id: 'multi-line-comment'
        },
        '/': {
          type: 'block',
          end: '\n',
          id: 'single-line-comment'
        },
        'other': {
          type: 'block',
          end: '/',
          id: 'regexp-literal'
        }
      }
    },
};
