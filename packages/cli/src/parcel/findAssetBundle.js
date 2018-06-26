function findAssetBundle(assetName, bundle) {
  for (let b of bundle.childBundles) {
    for (let asset of b.assets) {
      if (asset.name === assetName) {
        return b.name;
      }
    }
  }
  return null;
}

module.exports = findAssetBundle;