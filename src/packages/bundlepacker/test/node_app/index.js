const readText = require('./app');
const manifest = require('./manifest.json');
console.log('Start2');
console.dir(manifest)
readText('./text.txt').then(content => {
    console.log(content);
});
