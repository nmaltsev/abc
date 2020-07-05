// TODO good to have such method
function appendProperty($m, property_s, value) {
  const list = $m.get(property_s);

  if (!Array.isArray(list)) return;
  list.push(value);
  $m.change(property_s, list.slice())
}

function getID(){
  return ~~(Math.random() * 1000) + '';
}

let $newItem;
const model = new Backside.Model({
  newValue: null,
  list: [
    {value: 'first', id: getID()},
  ],
});

const _unbind = model.listen({
  'onNewItem': (e, m_o) => {
    e.preventDefault();
    const value = m_o.get('newValue');

    if (!value) return;
    appendProperty(m_o, 'list', {value, id: getID()});
    m_o.change('newValue', '');
    $newItem.focus();
  },
  'change:list': (list, m_o) => {
    console.log('The list has changed');
    console.dir(list);
  },
  'init-ref:itemInput': ($input) => {
    $newItem = $input;
    setTimeout(function(){ $input.focus(); }, 500);
  },
  'onListClick': (e, m_o) => {
    if (e.target.tagName != 'BUTTON' || !e.target.dataset.id) return;
    let deleteId = e.target.dataset.id;
    m_o.change('list', m_o.get('list').filter(item => item.id !== deleteId));
  },
}/*, true*/);
console.log('Start');
console.dir(model);

const cleaningTree = viewcompiler(document.body, model);

window.ct = cleaningTree;
window.model = model;

