// for exctracting items use pop() method
	
class LimitedStack extends Array {
  add(item) {
    this.push(item);
    
    if (this.length > this.MAX_STACK_SIZE) {
      this.splice(0, this.length - this.MAX_STACK_SIZE);
    }
  }
} 

LimitedStack.prototype.MAX_STACK_SIZE = 10; 
module.exports = LimitedStack;
