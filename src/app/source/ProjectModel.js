const DocumentModel = require('./DocumentModel');
const BacksideModel = require('../../packages/backside/model');
const AxiosInstances = require('./instances.axios');

const PROP_RDOCID = 'remoteDocId';
const PROP_COUNTER = 'counter';
const PROP_OPENED = 'opened_ids';
const PROP_DOCS = 'docs';

class ProjectModel extends BacksideModel {
  /**
   * @param {Object} conf
   * @param {string[]} conf.opened_ids
   * @param {number} conf.counter
   * @param {string} conf.remoteRefId
   */

	constructor(conf) {
		super(conf);
		if (!Array.isArray(conf[PROP_OPENED])) this.set(PROP_OPENED, []);
		const docs = this.get(PROP_DOCS);
		const docIdList = Object.keys(docs);
		const maxIndex = docIdList.length > 0 ? Math.max.apply(null, docIdList.map(num => parseInt(num, 10))) + 1 : 0;
		this.set(PROP_COUNTER, maxIndex);

		if (!conf.hasOwnProperty(PROP_RDOCID)) this.set(PROP_RDOCID, 0);
		this.docIDMap = {};
		
		for(let id in docs){
			this._add(new DocumentModel(docs[id]), id);
		}
	}
  
	_add(model, id) {
		var id = id || this.attr[PROP_COUNTER]++ + '';

		this.attr[PROP_DOCS][id] = model;
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
	
	_markSpaceAsClosed(docId) {
		var pos = this.attr[PROP_OPENED].indexOf(docId);
		if (pos < 0) return;
		this.attr[PROP_OPENED][pos] = null;
	}
  
	spaceChange(spaceId, docId){
		if (Array.isArray(this.attr[PROP_OPENED])) {
			this._markSpaceAsClosed(docId);
			this.attr[PROP_OPENED][spaceId] = docId;
		}
		this.trigger('spaceChange');
	}
  
	closeSpace(docId){
		this._markSpaceAsClosed(docId);
		this.trigger('spaceChange');
	}
	
  createProjectSnapshot() {
		let docs = this.get('docs');
    let id;
		let prj = {
			model: {
				[PROP_DOCS]: {},	
			},
		};

		this.export(ProjectModel.EXPORTED_PROPERTIES, prj.model);

		for(id in docs){
			prj.model[PROP_DOCS][id] = docs[id].export(DocumentModel._exportedProperties);
		}
    
		return prj;
	}
	
	static createEmpty(){
		return new ProjectModel({
			[PROP_RDOCID]: null,
			[PROP_COUNTER]: 0,
			title: '',
			gridId: '7', // the layout grid
			[PROP_OPENED]: Array(4), // Opened documents
			current_doc: 0, // id of the focused doc
			[PROP_DOCS]: {}
		});
	}	

	save(){
		const snapshot = this.createProjectSnapshot();
    
    AxiosInstances.docStorage.post('docs.json', snapshot)
      .then((resp) => {
				this.change(PROP_RDOCID, resp.data.name);
      }, (error) => {
				console.log('Error');
				console.dir(error);
      });
	}

	/**
	 * @param {string} projectId
	 * @return {Promise<Object>}
	 */
	static load(projectId){
		return AxiosInstances.docStorage.get(`/docs/${projectId}/.json`);
	}
  
}

ProjectModel.EXPORTED_PROPERTIES = ['current_doc', 'opened_ids', 'title', 'blocks', PROP_COUNTER, PROP_RDOCID];

module.exports = ProjectModel;
  
