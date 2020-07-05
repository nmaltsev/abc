const model = new Backside.Model({
  type: 0,
  text1: 'abc',
  text2: 'abc123',
  text4: '***',
});

model.listen({
  'change:type': function(typeId, m){
    console.log('[change:type] %s', typeId);
  },
  'change:text4': function(value, m){
    console.log('[change:text4] %s', value);
  },
  'form-submit': function(e){
    e.preventDefault();
    console.log('[Form submit]');
    console.dir(e);
  },
  'init-alias:form-input': function($input){
    console.log('Input');
    console.dir($input);
  },
  'init-ref:line1': function($line){
    console.log('Init line');
    console.dir($line);
  },
  'destroy-ref:line1': function($line){
    console.log('Remove line');
    console.dir($line);
  },
  'change:hp1': (value_n, m_o) => {
    console.log('[change:hp1] %s', value_n);
    
  },
  'change:vp1': (value_n, m_o) => {
    console.log('[change:vp1] %s', value_n);
      
  },
})
console.log('Start');
console.dir(model);

viewcompiler(document.body, model);
