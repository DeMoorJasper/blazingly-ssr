// Node modules
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const critical = require('critical');

// Local requires
const glob = require('../utils/glob');
const Bundle = require('./Bundle');
const snapshot = require('../react/snapshotRender');
const RequestHandler = require('./RequestHandler');

class Page {
  constructor({name, pageRoot, project, options = {}}) {
    this.name = name;
    this.options = options;
    this.rootDir = pageRoot;
    this.project = project;
    this.outDir = path.join(this.options.outDir, this.name);
    this.bundles = new Map();
    this._pageData = null;
    this.pageDataPath = path.join(this.rootDir, 'pageData.json');
    this._requestHandler = null;
  }

  addBundle(type, bundle) {
    if (!this.bundles.has(type)) {
      this.bundles.set(type, new Set());
    }
    this.bundles.get(type).add(bundle);
  }

  async getPageData() {
    if (!this._pageData) {
      if (await fs.exists(this.pageDataPath)) {
        this._pageData = JSON.parse((await fs.readFile(this.pageDataPath)).toString());
      } else {
        this._pageData = {};
      }
      this._pageData = _.merge(this._pageData, await this.project.getSiteData());
    }
    return this._pageData;
  }

  async gatherEntryPoints() {
    // Gather JS files
    let jsPath = path.join(this.rootDir, 'js');
    if (await fs.pathExists(jsPath)) {
      let jsFiles = await glob(path.join(jsPath, 'App.*'), {
        nodir: true
      });
      if (jsFiles.length > 0) {
        this.addBundle(
          'js',
          new Bundle({
            type: 'js',
            entry: jsFiles[0],
            parent: this,
            options: this.options,
            isBrowserBundle: false
          })
        );
      }
    }

    // Gather CSS files
    let cssPath = path.join(this.rootDir, 'css');
    if (await fs.pathExists(cssPath)) {
      let cssFiles = await glob(path.join(cssPath, '*'), {
        nodir: true
      });
      if (cssFiles.length > 0) {
        for (let cssFile of cssFiles) {
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
  }

  async getRequestHandler() {
    // Gather request handlers
    if (!this._requestHandler) {
      let requestHandlerPossibilities = await glob(path.join(this.rootDir, 'handleRequest.*'), {
        nodir: true
      });

      if (requestHandlerPossibilities.length > 0) {
        this._requestHandler = new RequestHandler(requestHandlerPossibilities[0], this);
      }
    }
    return this._requestHandler;
  }

  async _postProcessBundles(parcelBundle) {
    let promises = [];
    for (let bundleSet of this.bundles.values()) {
      for (let bundle of bundleSet) {
        promises.push(bundle.postProcess(parcelBundle));
      }
    }
    await Promise.all(promises);
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

    await fs.writeFile(path.join(this.options.outDir, this.name, 'bundlePaths.json'), JSON.stringify(bundlePaths));
  }

  async postProcess(parcelBundle) {
    await fs.writeFile(
      path.join(this.options.outDir, this.name, 'pageData.json'),
      JSON.stringify(await this.getPageData())
    );

    await this._postProcessBundles(parcelBundle);
    await this.writeBundlePathsJSON();

    return this;
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

  getBundlePathsByType(type) {
    let projectCSS = this._getBundlesFromBundleMap(this.project.bundles).filter(bundle => bundle.type === type);
    let pageCSS = this._getBundlesFromBundleMap(this.bundles).filter(bundle => bundle.type === type);
    return [].concat(projectCSS, pageCSS).map(bundle => bundle.blazingBundlePath);
  }

  getCSSBundles() {
    return this.getBundlePathsByType('css');
  }

  getJSBundles() {
    return this.getBundlePathsByType('js');
  }

  getRenderScript() {
    return this._getBundlesFromBundleMap(this.bundles).find(bundle => bundle.type === 'js' && !bundle.isBrowserBundle);
  }

  async snapshot(isProduction = true) {
    let cssBundles = this.getCSSBundles();
    let content = await snapshot({
      page: this,
      cssBundles,
      isProduction
    });

    if (cssBundles.length > 0) {
      // Extract critical css
      let criticalCss = await critical.generate({
        html: content,
        base: this.options.outDir,
        folder: this.options.outDir,
        minify: true,
        ignore: ['@font-face', /url\(/]
      });

      content = content.replace('/* BLAZINGLY INLINE CRITICAL CSS */', criticalCss);
      await fs.writeFile(path.join(this.outDir, 'critical.css'), criticalCss);
    }

    await fs.writeFile(path.join(this.outDir, 'index.html'), content);
  }
}

module.exports = Page;
