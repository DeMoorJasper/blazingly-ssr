// Node modules
const path = require('path');
const fs = require('fs-extra');

// Local requires
const createServiceWorker = require('../utils/createServiceWorker');
const md5 = require('../utils/md5');

class ServiceWorker {
  constructor({ project, options }) {
    this.project = project;
    this.options = options;
    this.content = '';
    this.path = '';
  }

  async createServiceWorker() {
    if (!this.content) {
      this.content = await createServiceWorker({
        files: this.project.getAllBundlePaths(),
        rootDir: this.options.outDir
      });
    }
    return this.content;
  }

  async writeServiceWorker() {
    this.path = path.join(this.options.outDir, `sw-${md5(await this.createServiceWorker())}.js`);
    await fs.writeFile(this.path, await this.createServiceWorker());
  }
}

module.exports = ServiceWorker;