A lightweight zero-configured bundle compiler

## How to compile the bundle:
- `node bundle.js -i enum.js -a enum_test.js -o final.js`
- `node bundle.js -i index.js -o index.bundle.js`

## Cptions

- `-i <index file path>` - the bundle entry point,
- `-a <attached file path>` - an additional file to be included in the bundle,
- `-b <local repository path>` - redefined path to the local repository,
- `-r <report file path>` - all compilation errors will be saved in this file,
- `-o <output file path>` - path to the compiled bundle file,

### Basic example

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
node bundle.js -i index.js -o out.bundle.js
node out.bundle.js
```

### Example with local repository

To compile bundle with an overrided local repository folder: `node bundle.js -i index.js -b ./modules -o result.js`  

