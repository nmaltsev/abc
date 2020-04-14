const BacksideModel = require('../../packages/backside/model');

//==========================================
// DocumentModel 
//==========================================
class DocumentModel extends BacksideModel {
		constructor(conf){
			super(conf);
			this.attr.blocks = conf.blocks || {};
		}
		getPresentationID(){
			return this.get('id') + '-' + this.get('mime');
		}
		createCodeBlock(code){
			var id = this.genearateId();

			this.attr.blocks[id] = code;
			return id;
		}
		genearateId(){
			var r = ~~(Math.random() * 100000000);

			return this.attr.blocks[r] != undefined ? this.genearateId() : r;
		}
		getSource(text){
			var 	code = text != undefined ? text : this.get('content'),
						_blocks = this.get('blocks'),
						_isNeedContinue = false;

			this._hiddenBlockPattern.lastIndex = 0;

			code = code.replace(this._hiddenBlockPattern, function(sub, blockCode){
				_isNeedContinue = true;
				return _blocks[blockCode];
			});

			// resolve nested hidden blocks
			return _isNeedContinue ? this.getSource(code) : code;
		}
};

DocumentModel.prototype._hiddenBlockPattern = /\%b(\d+)b\%/g;
DocumentModel.prototype._hiddenLinePattern = /^\%b(\d+)b\%$/;
DocumentModel._exportedProperties = ['title', 'mime', 'content', 'blocks'];

module.exports = DocumentModel;
