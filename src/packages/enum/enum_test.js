let Enum = require('./enum');
let colors = Enum('red', 'green', 'blue');
let keys = Enum({
	Enter: 27,
	Tab: 9
})



console.log('Colors');
console.dir(colors); 
colors.red = 22;
console.log(colors.red == 1);
console.log(keys.Enter); 

 
