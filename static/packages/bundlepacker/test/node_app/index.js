const readText = require('./app');
console.log('Start');
readText('./text.txt').then(content => {
    console.log(content);
});