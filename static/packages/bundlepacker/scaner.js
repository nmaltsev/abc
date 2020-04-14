const {
  getBasePath,
  readText,
  getDir,
  catchDependencies,
  normalizePath
} = require('./utils');
const { _mergePaths } = require('./bundle.members');

class Resource {
  constructor(path_s, parentResource) {
    this.path = path_s;
    this.parent = parentResource;
  }
  
  /**
   * @return {Promise<Resource[]>}
   */
  findDependencies() {
    let dirPath = getDir(this.path);
    return readText(this.path)
      .then((source_s) => {
          return catchDependencies(source_s)
            .map((relativePath_s) => {
                return new Resource(
                  _mergePaths(dirPath, relativePath_s) + '.js',
                  this
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
  constructor (path_s) {
    this.load(path_s);
  }
  
  /**
   * @param {string} path_s - absolute path to the root resource
   * @return {void} 
   */
  load(path_s) {
    this.root = new Resource(path_s);
    this.generations = [[this.root]];
    this.counter = 0;
  }
  
  /**
   * @return {Promise<Resource[]>} - the list of resources detect in the generation 
   */
  next() {
    const currentGeneration = this.generations[this.counter];
    
    this.counter++;
    return Promise.all(
      currentGeneration.map((resource) => resource.findDependencies())
    ).then((results) => {
      const generationQueue = results.reduce((list, subList) => list.concat(subList), []);
      
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
