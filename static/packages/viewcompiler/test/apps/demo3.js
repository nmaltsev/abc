const model = new Backside.Model({
  gridScheme: '0',
  list: [
    {value: 'value1', label: 'label1'},
    {value: 'value2', label: 'label2'},
    {value: 'value3', label: 'label3'},
  ],
  listItem: 'value2',
  verticalValues: '7,11,15,23,27,3'.split(','),
});

const _unbind = model.listen({
  'change:hp1': (value_n, m_o) => {
    console.log('[change:hp1] %s', value_n);
  },
  'change:vp1': (value_n, m_o) => {
    console.log('[change:vp1] %s', value_n);
  },
  'change:gridScheme': (gridScheme_n, m_o) => {
    console.log('SP gs: %s', gridScheme_n);
    
  },
}/*, true*/);
console.log('Start');
console.dir(model);

const cleaningTree = viewcompiler(document.body, model);

window.ct = cleaningTree;
window.model = model;
