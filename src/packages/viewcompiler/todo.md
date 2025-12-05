## FR 1 create a web componet
```HTML
<model value="{prop1: 123}" id="model1">
    <label><input type="checkbox" *model="toggle"/>Toggle</label>
</model>
```
```JS
// Get object  from the Value property
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
const cleaningTree = viewcompiler(<the roort element>, model, pipeMap);
```
Get access to the model 
```JS
document.getElementById('model1').model
```