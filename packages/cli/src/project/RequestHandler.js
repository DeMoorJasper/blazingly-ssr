// Node modules
const fs = require('fs-extra');
const path = require('path');

// Local requires
const findAssetBundle = require('../parcel/findAssetBundle');
const getAssetId = require('../parcel/getAssetId');

class RequestHandler {
  constructor(entry, page) {
    this.entry = entry;
    this.bundlePath = null;
    this.assetId = null;
    this._contents = null;
    this.page = page;
    this.blazingBundlePath = null;
  }

  async postProcess() {
    if (this.bundlePath) {
      await fs.writeFile(this.blazingBundlePath, await this.getContent());
    }
  }

  async getContent() {
    if (this.bundlePath) {
      if (!this._contents) {
        this._contents = (await fs.readFile(this.bundlePath)).toString();
      }
      return this._contents;
    } else {
      return null;
    }
  }

  findBundlePath(parcelBundle) {
    this.bundlePath = findAssetBundle(this.entry, parcelBundle);
    if (this.bundlePath) {
      this.blazingBundlePath = path.normalize(this.bundlePath.replace('.parcel-dist', ''));
      this.assetId = getAssetId(this.entry, parcelBundle);
    }
  }
}

module.exports = RequestHandler;
