const {
  getBasePath,
  readText,
  getDir,
  catchDependencies,
  normalizePath
} = require('./utils');
const { BUNDLE_CLASS } = require('./bundle.members');

class Resource {
  
  /**
   * @param {string} path_s
   * @param {Resource} parentResource
   * @param {string} requestedResource_s
   */
  constructor(path_s, parentResource, requestedResource_s) {
    this.path = path_s;
    this.parent = parentResource;
    this.requestedResource = requestedResource_s
  }
  
  /**
   * @param {string} [localPackagePath_s]
   * @return {Promise<Resource[]>}
   */
  findDependencies(localPackagePath_s) {
    const dirPath = getDir(this.path);
    return readText(this.path)
      .then((source_s) => {
          return catchDependencies(source_s)
            .map((relativePath_s) => {
                return new Resource(
                  BUNDLE_CLASS._mergePaths(dirPath, relativePath_s, localPackagePath_s) + '.js',
                  this,
                  relativePath_s
                );
            }); 
      })
  }
  
  /**
   * @param {Resource} resource
   * @return {boolean}
   */
  isSame(resource) {
    if (!(resource instanceof Resource)) return false;
    return this.path === resource.path;
  }
}


class DependencyScaner {
  constructor (path_s, localPackagePath_s) {
    this.load(path_s, localPackagePath_s);
  }
  
  /**
   * @param {string} path_s - absolute path to the root resource
   * @param {string} [localPackagePath_s]
   * @return {void} 
   */
  load(path_s, localPackagePath_s) {
    this.root = new Resource(path_s);
    this.generations = [[this.root]];
    this.counter = 0;
    this.localPackagePath_s = localPackagePath_s;
    this._notFoundResources = [];
  }
  
  /**
   * @param {string[]} resources
   * @return {void}
   */
  addAdditionalResources(resources) {
    // The unshift() method is used because the initial script should be in the end of the list
    this.generations[0].unshift.apply(this.generations[0], resources.map(resource => new Resource(resource)));
  }
  
  /**
   * @return {Promise<Resource[]>} - the list of resources detect in the generation 
   */
  next() {
    const currentGeneration = this.generations[this.counter];
    
    this.counter++;
    return Promise.all(
      currentGeneration.map((resource) => resource
        .findDependencies(this.localPackagePath_s)
        .catch(e => { 
          // It is possible that the requested resource is a npm package
          // todo:
          // 1. request <module name>/index
          // 2. find in the package.json the index resource
          // 3. the system node.js package 
          this._notFoundResources.push({
            resource: resource.requestedResource,
            path: resource.path,
            parent: resource.parent && resource.parent.path
          });
          // all Promise.all results should be filtered from null values
          return null;
        })
      )
    ).then((results) => {
      const generationQueue = results
        .reduce((list, subList) => list.concat(subList), [])
        .filter(res => res instanceof Resource);
      
      this.generations.push(generationQueue);
      return generationQueue;
    });
  }
  
  /**
   * @return {Promise<void>}
   */
  directPropagation() {
    return this.next()
      .then((generationQueue) => {
        if (generationQueue.length > 0) return this.directPropagation();
        return void(0);
      });
  }
  
  /**
   * @return {string[]}
   */
  backPropagation() {
    let i = this.generations.length - 1;
    const dependencyOrder = [];
    while (i-- > 0) {
      this.generations[i].forEach((resource) => {
        if (dependencyOrder.find((existedResource) => existedResource.isSame(resource))) return;
        dependencyOrder.push(resource);
      });
    }
    
    return dependencyOrder.map((resource) => resource.path);
  }
}

module.exports = DependencyScaner;
