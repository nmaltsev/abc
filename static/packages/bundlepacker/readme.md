## Usage
- `node bundle.js enum.js enum_test.js > final.js`
- `node bundle.js index.js`


### Use case: list of scripts

script.js
```
module.exports.properties = {
	test: 12
};
```

index.js:
```
let properties = require('script').properties;
console.log(properties);
```
Commands:
```
node bundle.js index.js > out.bundle.js
node out.bundle.js
```


### Use case: a single point of entry

The command: `node bundle.js index.js`
