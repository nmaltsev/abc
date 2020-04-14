const Request = require('../lib/xhr');
const DocumentModel = require('DocumentModel');
const BacksideModel = require('../../packages/backside/model');

class ProjectModel extends BacksideModel {
  
  constructor(conf) {
    super(conf);
    if (!conf.opened_ids) model.set('opened_ids', []);
		this.docIDMap = {};
		this._counter = 0;
  }
  
  _add(model, id) {
		var 	id = id || this._counter++ + '';

		this.attr.docs[id] = model;
		model.set('id', id);
		this.docIDMap[model.get('title')] = id;
		this.trigger('add', model, this);
	}
  
	add(list){
		var  	i = list.length;

		while(i-- > 0){
			this._add(list[i]);
		}
	}
  
	spaceChange(spaceId, docId){
		if(Array.isArray(this.attr.opened_ids)){
			var pos = this.attr.opened_ids.indexOf(docId);
			
			if(pos != -1){
				// this.attr.opened_ids.splice(pos, 1);
				this.attr.opened_ids[pos] = null;
			}
			
			this.attr.opened_ids[spaceId] = docId;
		}
		this.trigger('spaceChange');
	}
  
	closeSpace(docId){
		var pos = this.attr.opened_ids.indexOf(docId);

		if(pos != -1){
			this.attr.opened_ids[pos] = null;
		}
		this.trigger('spaceChange');
	}
	
  createProjectSnapshot() {
		let docs = this.get('docs');
    let id;
		let prj = {
			model: {
				docs: {},	
			},
			_counter: this._counter,
		};

		this.export(['current_doc', 'opened_ids', 'title', 'blocks'], prj.model);

		for(id in docs){
			// todo ovveride export() method
			prj.model.docs[id] = docs[id].export(DocumentModel._exportedProperties);
		}
    
		return prj;
	}
	
	static createEmpty(){
		return new ProjectModel({
			title: '',
			gridId: '7', // the layout grid
			opened_ids: Array(4), // Opened documents
			current_doc: 0, // id of the focused doc
			docs: {}
		});
	}	

	// @todo
	static save(){
		/*
     * var 	hash = $MD.MD5(JSON.stringify(this.attr));
		var 	data = $m.clone(this.attr),
				i = data.docs.length;

		data.key = hash;

		// console.log('[CALL save model]');
		// console.log('MD5 %s', hash);
		// console.dir(data);

		new Request(this.CONTENT_URL).post(data, 'application/json').then(function(d, r){
			// console.log('Save success');
			// console.dir(d);
			// console.dir(r);

			if(!d.ec){
				// Use key to modify url query
				history.pushState({
					key: d.key
				}, 'Project', '?project=' + d.key);
			}else{
				// Fail too
			}
		}).catch(function(e){
			// console.log('Save fail');
			// console.dir(e);
		});*/
	}
	// TODO
	static load(projectId){
		/*new Request(this.CONTENT_URL + projectId).get().then(function(d, r){
			// console.log('Load success');
			// console.dir(d);
			// console.dir(r);
		}).catch(function(e){
			// console.log('LOAD fail');
			// console.dir(e);
		});*/
	}
  
}

module.exports = ProjectModel;
  
