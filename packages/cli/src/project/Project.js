// Node modules
const path = require('path');
const fs = require('fs-extra');

// Local requires
const glob = require('../utils/glob');
const Bundle = require('./Bundle');
const Page = require('./Page');
const ServiceWorker = require('./ServiceWorker');

class Project {
  constructor(projectRoot, options = {}) {
    this.rootDir = projectRoot;
    this.options = options;
    this.pages = new Map();
    this._siteData = null;
    this.siteDataPath = path.join(this.rootDir, 'siteData.json');
    this.globalCssDir = path.join(this.rootDir, 'css');
    this.bundles = new Map();
    this.serviceWorker = new ServiceWorker({
      project: this,
      options: this.options
    });
  }

  async getSiteData() {
    if (!this._siteData) {
      if (await fs.exists(this.siteDataPath)) {
        this._siteData = JSON.parse((await fs.readFile(this.siteDataPath)).toString());
      } else {
        this._siteData = {};
      }
    }
    return this._siteData;
  }

  async getPages() {
    let subFolders = await fs.readdir(this.rootDir);
    let promises = [];
    for (let folder of subFolders) {
      let absoluteFolderPath = path.join(this.rootDir, folder);
      if (absoluteFolderPath !== this.globalCssDir) {
        let stat = await fs.stat(absoluteFolderPath);
        if (stat.isDirectory()) {
          let page = new Page({
            name: folder,
            pageRoot: path.join(this.rootDir, folder),
            project: this,
            options: this.options
          });
          this.pages.set(folder, page);
          promises.push(page.gatherEntryPoints());
          promises.push(page.getPageData());
        }
      }
    }
    await Promise.all(promises);
  }

  addBundle(type, bundle) {
    if (!this.bundles.has(type)) {
      this.bundles.set(type, new Set());
    }
    this.bundles.get(type).add(bundle);
  }

  async getGlobalCSS() {
    let globalCSSFiles = await glob(path.join(this.globalCssDir, '*'), {
      nodir: true
    });
    if (globalCSSFiles.length > 0) {
      for (let cssFile of globalCSSFiles) {
        this.addBundle(
          'css',
          new Bundle({
            type: 'css',
            entry: cssFile,
            parent: this,
            options: this.options,
            isBrowserBundle: true
          })
        );
      }
    }
  }

  _getBundlesFromBundleMap(bundleMap) {
    let bundles = [];
    for (let bundleSet of bundleMap.values()) {
      for (let bundle of bundleSet) {
        bundles.push(bundle);
      }
    }
    return bundles;
  }

  getAllBundles() {
    let bundles = [].concat(this._getBundlesFromBundleMap(this.bundles));

    for (let page of this.pages.values()) {
      bundles = bundles.concat(this._getBundlesFromBundleMap(page.bundles));
    }

    return bundles;
  }

  getAllEntrypointPaths() {
    return this.getAllBundles().map(bundle => bundle.entry);
  }

  getAllBundlePaths() {
    return this.getAllBundles().map(bundle => bundle.blazingBundlePath);
  }

  async getAllRequestHandlers() {
    let promises = [];
    for (let page of this.pages.values()) {
      promises.push(page.getRequestHandler());
    }
    return await Promise.all(promises);
  }

  async updateRequestHandlerBundles(parcelBundle) {
    let requestHandlers = await this.getAllRequestHandlers();
    let promises = [];
    for (let requestHandler of requestHandlers) {
      requestHandler.findBundlePath(parcelBundle);
      promises.push(requestHandler.postProcess());
    }
    await Promise.all(promises);
  }

  async writeRedirects() {
    let mappings = {};

    mappings['/sw.js'] = '/' + path.basename(this.serviceWorker.path);

    await fs.writeFile(path.join(this.options.outDir, 'redirects.json'), JSON.stringify(mappings));
  }

  async writeBundlePathsJSON() {
    let bundlePaths = {};
    for (let bundleSet of this.bundles.values()) {
      for (let bundle of bundleSet) {
        if (bundle.isBrowserBundle) {
          if (!bundlePaths[bundle.type]) {
            bundlePaths[bundle.type] = [];
          }
          bundlePaths[bundle.type].push('/' + path.relative(this.options.outDir, bundle.blazingBundlePath));
        }
      }
    }

    await fs.writeFile(path.join(this.options.outDir, 'bundlePaths.json'), JSON.stringify(bundlePaths));
  }

  async postProcessParcelBundle(parcelBundle) {
    let promises = [];

    promises.push(
      fs.writeFile(path.join(this.options.outDir, 'siteData.json'), JSON.stringify(await this.getSiteData()))
    );

    for (let page of this.pages.values()) {
      promises.push(page.postProcess(parcelBundle));
    }

    for (let bundle of this._getBundlesFromBundleMap(this.bundles)) {
      promises.push(bundle.postProcess(parcelBundle));
    }

    await Promise.all(promises);
    await this.serviceWorker.writeServiceWorker();
    await this.writeBundlePathsJSON();

    await this.writeRedirects();
  }

  async snapshotPages() {
    let promises = [];
    for (let page of this.pages.values()) {
      promises.push(page.snapshot());
    }
    await Promise.all(promises);
  }
}

module.exports = Project;
