function each(collection, callback){
	if(typeof(collection.length) != 'undefined'){
		for(var i = 0, len = collection.length; i < len; i++){
			callback(collection[i], i);
		}
	}else{
		for(var p in collection){
			if(collection.hasOwnProperty(p)){
				callback(collection[p], p);
			}
		}
	}
};

module.exports = each;
