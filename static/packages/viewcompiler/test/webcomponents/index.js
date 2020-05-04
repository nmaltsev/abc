function appendProperty($m, property_s, value) {
  const list = $m.get(property_s);

  if (!Array.isArray(list)) return;
  list.push(value);
  $m.change(property_s, list.slice())
}

function getID(){
  return ~~(Math.random() * 1000) + '';
}


class TodoList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.$root = this.shadowRoot || this;
    const $template = document.all['template-todo-list'];
    this.$root.appendChild($template.content.cloneNode(true));
  }
  
  static get observedAttributes() {
    return [];
  }
  
  connectedCallback() {
    this.init();
  }
  
  disconnectedCallback() {
    console.log('[CALL disconnectedCallback]');
    if (this._unbindModel) this._unbindModel();
    if (this._cleaningTree) this._cleaningTree.destroy();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    console.log('[attributeChangedCallback]');
  }
  
  adoptedCallback() {
    console.log('[adoptedCallback]');
  }
  
  init() {
    const model = new Backside.Model({
      newValue: null,
      list: [
        {value: 'first', id: getID()},
      ],
    });
    
    let $newItem;
    this._unbindModel = model.listen({
      'onNewItem': (e, m_o) => {
        e.preventDefault();
        const value = m_o.get('newValue');

        if (!value) return;
        appendProperty(m_o, 'list', {value, id: getID()});
        m_o.change('newValue', '');
        $newItem.focus();
      },
      'change:list': (list, m_o) => {
        console.log('The list changed');
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
    });

    this._cleaningTree = viewcompiler(this.$root, model);
  }
}

customElements.define('todo-list', TodoList);
