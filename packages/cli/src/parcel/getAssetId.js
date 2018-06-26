function getAssetId(assetName, bundle) {
  for (let b of bundle.childBundles) {
    for (let asset of b.assets) {
      if (asset.name === assetName) {
        return asset.id;
      }
    }
  }
  return null;
}

module.exports = getAssetId;