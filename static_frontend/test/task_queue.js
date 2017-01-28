function TaskQueue(){}
TaskQueue.prototype = Object.create(Array.prototype); // Extended by array
// @param {Int|XmlHttpRequest|node.js timeout instance} process
TaskQueue.prototype.add = function(process){
	this.push(process);
};
TaskQueue.prototype.remove = function(process){
	var pos = this.indexOf(process);

	if(pos != -1){
		this[pos] = null;
	}
};
TaskQueue.prototype.destroy = function(){
	var 	i = this.length;

	while(i--) if(this[i]){
		if(this[i].abort){
			this[i].abort();
		}else{
			clearTimeout(this[i]);	
		}
	}
	
	this.length = 0;
};


var taskManager = new TaskQueue();

taskManager.add(setTimeout(function(){
	console.log('Timeout 1000');
	taskManager.destroy();
}, 1000));

taskManager.add(setTimeout(function(){
	console.log('Timeout 2000');
}, 2000));

taskManager.add(setTimeout(function(){
	console.log('Timeout 3000');
}, 3000));
