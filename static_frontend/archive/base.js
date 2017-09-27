//=========================================
// Base provider
//=========================================
{
	function Base(instance){
		this.base = instance;
		Backside.Events.call(this);
	}
	Base.prototype = Object.create(Backside.Events.prototype);
	Base.prototype.constructor = Backside.Events;
	// for clean stores at base
	Base.prototype.clean = function(next){
		var 	storeNames = Array.prototype.slice.call(this.base.objectStoreNames);
				compTrans = this.base.transaction(storeNames, 'readwrite'),
				i = storeNames.length;

		compTrans.onerror = function(e){
			console.log('clean error');
			console.dir(e);
		}
		if(next){
			compTrans.oncomplete = function(e){
				next(this);
			}
		}

		while(i-- > 0){
			compTrans.objectStore(storeNames[i]).clear();
		}
	};
	// original add() method - abort whole transaction if one key was duplicated
	// put operation can add and merge objects!
	// @param {Object|Array} object
	Base.prototype.put = function(storeId, object){
		var 	compTrans = this.base.transaction([storeId], 'readwrite'), //"readonly"
				compStore = compTrans.objectStore(storeId);

		compTrans.onerror = function(e){
			console.log('Put trans error `%s`', e.target.error.message);
			console.dir(e);
		}
		compTrans.oncomplete = function(e){
			this.trigger('put:' + storeId, object, this);
		}.bind(this);

		if(Array.isArray(object)){
			var 	size = object.length,
					i = 0;

			for(;i < size; i++){
				compStore.put(object[i]);
			}
		}else{
			compStore.put(object);
		}
		return this;
	};
	Base.prototype.get = function(storeId, id, cb){
		var 	compTrans = this.base.transaction([storeId], 'readonly'),
				compStore = compTrans.objectStore(storeId),
				_request;

		compTrans.oncomplete = function(e){
			cb && cb(_request.result);
		};
		_request = compStore.get(id);
	};
	Base.connect = function(dbName, version){
		var 	request = indexedDB.open(dbName, (version || 1)),
				_upgrade,
				_next;

		request.onsuccess = function(){
			_next(request.result);
		}
		request.onupgradeneeded = function(e){
			_upgrade(e.currentTarget.result);
		}
		return {
			then: function(cb){
				_next = cb;
				return this;
			},
			upgrade: function(cb){
				_upgrade = cb;
				return this;
			}
		};
	};
	Base.prototype.remove = function(storeId, key){
		var 	compTrans = this.base.transaction([storeId], 'readwrite'), //"readonly"
				compStore = compTrans.objectStore(storeId);

		compTrans.onerror = function(e){
			console.log('Remove trans error `%s`', e.target.error.message);
			console.dir(e);
		}
		compTrans.oncomplete = function(e){
			this.trigger('remove:' + storeId, key, this);
		}.bind(this);

		compStore.delete(key);	
		return this;
	};
	// @param {String} storeId  
	// @param {String} arg2 - index name (optional)
	// @param {IDBKeyRange} arg3 - range (optional)
	// @param {Function} arg4 - callback
	Base.prototype.readStore = function(storeId, arg2, arg3, arg4){
		var 	transaction = this.base.transaction([storeId], 'readonly'),
  				objectStore = transaction.objectStore(storeId),
  				index = arg3 && arg2,
  				range = arg3 || arg2,
  				cb = arg4 || range,
  				cursor, _next;

  		if(index){
  			index = objectStore.index(index);
  		}

  		(index || objectStore).openCursor((range instanceof IDBKeyRange) ? range: null).onsuccess = function(event) {
			var cursor = event.target.result;
			
			if(cursor){
				cb(cursor.value);
				cursor.continue();
			}else{
				_next && _next(this);
			}
		};	

		return {
			then: function(cb){
				_next = cb;
			}
		};
	};
	Base.prototype.$removeByCursor = function(storeId, index, range, cb){
		var 	transaction = this.base.transaction([storeId], 'readwrite'),
  				objectStore = transaction.objectStore(storeId),
  				_next;

  		objectStore.index(index).openCursor(range).onsuccess = function(){
  			var cursor = event.target.result;
			
			if(cursor){
				cb(cursor.value) && cursor.delete();
				cursor.continue();
			}else{
				_next && _next(this);
			}
  		};

  		return {
			then: function(cb){
				_next = cb;
			}
		};
	};
}
/*
Examples of usage:
	_ruleBase.put('req_block_rules', {host: 'abc2', path: '*'})
	_ruleBase.put('req_block_rules', {host: 'abc2', path: '/path3'})
	_ruleBase.put('req_block_rules', {host: 'abc3', path: '/path4'})
	_ruleBase.put('req_block_rules', {host: 'abc3', path: '*'})
	_ruleBase.put('req_block_rules', {host: 'abc3', path: '/path5'})
	_ruleBase.put('req_block_rules', {host: 'abc3', path: '/path'})

	_ruleBase.remove('req_block_rules', ['abc2', '*'])
	_ruleBase.remove('req_block_rules', IDBKeyRange.only(['abc2', '*']))

	_ruleBase.readStore('req_block_rules', function(d){
		console.log('D:');
		console.dir(d);
	})
	_ruleBase.readStore('req_block_rules', 'host_index', function(d){
		console.log('D:');
		console.dir(d);
	})

	_ruleBase.readStore('req_block_rules', 'host_index', IDBKeyRange.only('abc2'), function(d){
		console.log('D:');
		console.dir(d);
	}).then(function(db){
		console.log('Reading complete');
	})
	_ruleBase.removeCollection('req_block_rules', [["abc2", "/path3"], ["abc2", "/path4"]]);

	_ruleBase.$removeByCursor('req_block_rules', 'host_index', IDBKeyRange.only('abc3'), function(d){
		return d.path != '*';
	})
*/
