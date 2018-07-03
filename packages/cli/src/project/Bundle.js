// Node modules
const path = require('path');
const fs = require('fs-extra');

// Local requires
const browserBootstrap = require('../react/browserBootstrap');
const findAssetBundle = require('../parcel/findAssetBundle');
const getAssetId = require('../parcel/getAssetId');
const md5 = require('../utils/md5');

class Bundle {
  constructor({ type, entry, parent, options = {}, isBrowserBundle = true, content = '', deleteOriginal = true }) {
    this.type = type;
    this.entry = entry;
    this.options = options;
    this.parent = parent;
    this.isBrowserBundle = isBrowserBundle;
    this.bundlePath = '';
    this.assetId = '';
    this.contentHash = '';
    this.content = content;
    this.deleteOriginal = deleteOriginal;
  }

  async postProcess(parcelBundle) {
    this.bundlePath = findAssetBundle(this.entry, parcelBundle);
    this.assetId = getAssetId(this.entry, parcelBundle);
    try {
      this.content = await fs.readFile(this.bundlePath);
    } catch(e) {
      if (!this.content) {
        throw new Error('Cannot read bundle');
      }
    }

    // This could prob be cleaner, but I guess it works...
    if (this.type === 'js' && !this.isBrowserBundle) {
      this.content = `var Page = (function() {
        var ${this.content};
        return parcelRequire(${this.assetId});
      })();`;

      await fs.writeFile(this.bundlePath, this.content);

      let browserBundle = new Bundle({
        type: this.type,
        entry: this.entry,
        content: browserBootstrap(this.content),
        parent: this.parent,
        options: this.options,
        isBrowserBundle: true,
        deleteOriginal: false
      });
      await browserBundle.postProcess(parcelBundle);
      this.parent.addBundle(this.type, browserBundle);
    }

    this.contentHash = md5(this.content);

    if (this.isBrowserBundle) {
      let hashedBundlePath = path.join(
        path.dirname(this.bundlePath),
        `${this.contentHash}${path.extname(this.bundlePath)}`
      );
      await fs.writeFile(hashedBundlePath, this.content);
      if (this.deleteOriginal) {
        try {
          await fs.unlink(this.bundlePath);
        } catch(e) {
          // File doesn't exist, just ignore and continue...
        }
      }
      this.bundlePath = hashedBundlePath;
    }

    return this;
  }
}

module.exports = Bundle;