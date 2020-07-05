const MainView = require('./MainView');
const DocumentModel = require('./DocumentModel');
const ProjectModel = require('./ProjectModel');
const Configs = require('./Configs');
const createDefaultProject = require('./defaultProject');
const createTestProject = require('./testProject');
const BacksideUtils = require('../../packages/backside/utils'); 


// Attention: If url contains `?project=` application make attempt to download data from server
var 	QUERY_OPTIONS = BacksideUtils.parseQuery(),
			LOCALSTORAGE_AVAILABLE = Configs.LOCALSTORAGE_AVAILABLE,
			prevPrjData;

//==========================================
// App
//==========================================
var App = new MainView(
  {el: document.body}, 
  LOCALSTORAGE_AVAILABLE &&
    (function(){
      var _initStateData = BacksideUtils.saveParse(window.localStorage.getItem('statesnapshot')) || {};
        return function() {
          return _initStateData;
        };
    }()),
  function(saveState_o) {
    if (!LOCALSTORAGE_AVAILABLE) return;
    setTimeout(function(){
      window.localStorage['statesnapshot'] = JSON.stringify(saveState_o);
    }, 200);
  }
);

document.onreadystatechange = function(){
  if(document.readyState == 'complete'){
    // Create default 
    App.controls.loadDefaultProject.onclick = function(){
      if(App.model) App.model.destroy(); // Trigger destroy event
      App.initProject(createDefaultProject());
    };
    App.controls.loadTestProject.onclick = function(){
      if(App.model) App.model.destroy(); // Trigger destroy event
      App.initProject(createTestProject());
    };
  }
}
// Here we can listen changes and save data (if necessery)
App.bus.on('start_new_project', function(app, foregroundId){
  setTimeout(function(){
    App.openAboutPopup();
  }, 200);
});	


if (!LOCALSTORAGE_AVAILABLE) {
  App.startNewProject();
}

const initStateData = BacksideUtils.saveParse(window.localStorage.getItem('statesnapshot')) || {};
const stateData = Object.assign({ // Merge in default settings
  showProjectList: false,
  hideListPanel: false,
  gridId: '7',
  gridScheme: 0 | 0x1,
  themeId: 'light',
}, initStateData);

if (QUERY_OPTIONS.project) {
  if (App.model) {
    console.warn('Model is already defined');
    return;
  }
  ProjectModel.load(QUERY_OPTIONS.project).then(resp => {
    const docs = resp.data.model.docs;
    
    if (App.model) App.model.destroy();
    const 	projectModel = new ProjectModel(resp.data.model);
    App.initProject(projectModel, stateData);
  }, error => {
    console.warn('Impossible to load %s', QUERY_OPTIONS.project);
  });
} else if (	
  (prevPrjData = BacksideUtils.saveParse(window.localStorage.getItem('lastsnapshot')))
) {
  if (App.model) App.model.destroy(); // Trigger destroy event

  const 	projectModel = new ProjectModel(Object.assign({ // Merge in default settings
    title: '',
    opened_ids: Array(4), // already opened documents
    current_doc: 0, // id of current focused doc
    docs: {},
    counter: 0
  }, prevPrjData.model));

  App.initProject(projectModel, stateData);
} else {
  App.startNewProject();
}
