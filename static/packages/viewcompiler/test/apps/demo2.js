const model = new Backside.Model({
  toggle: false,
  now: new Date(),
  typeSelect: '1',
  menuItems: [
    {item: '1', label: 'Label1'},
    {item: '2', label: 'Label2'},
    {item: '3', label: 'Label3'},
  ],
  domain: 'host'
});

model.listen({
  'change:toggle': function(isToggled, m){
    console.log('[change:toggle] %s', isToggled);
  },
  'init-ref:temp': function($node, m) {
    console.log('[init-alias:temp]');
    console.dir($node);
  },
  'destroy-ref:temp': function($node, m) {
    console.log('[remove-alias:temp]');
    console.dir($node);
  },
  'change:typeSelect': function(typeSelect, m){
    console.log('[change:typeSelect] %s', typeSelect);
  },
});
console.log('Start');
console.dir(model);

const pipeMap = {
  datePipe1: function(date){
    console.log(date);
    if (!(date instanceof Date)) return '';
    return date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
  },
};
const cleaningTree = viewcompiler(document.body, model, pipeMap);

window.ct = cleaningTree;
