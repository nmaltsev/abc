function Waterfall(){
	this.taskList = [];
}
Waterfall.prototype.add = function(cb){
	this.taskList.push(cb);	
};
Waterfall.prototype.prepend = function(cb){
	this.taskList.unshift(cb);	
};
Waterfall.prototype.resolve = function(data, $scope){
	var task = this.taskList.shift();
	
	if(task){
		task(this.resolve.bind(this), data, $scope);
	}	
};
	
module.exports = Waterfall;