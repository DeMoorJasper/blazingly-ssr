// Node modules
const fs = require('fs-extra');

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
    this.assetId = getAssetId(this.entry, parcelBundle);
  }
}

module.exports = RequestHandler;