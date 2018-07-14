function findAssetBundle(assetName, bundle) {
  for (let asset of bundle.assets) {
    if (asset.name === assetName) {
      return bundle.name;
    }
  }
  return null;
}

function findAssetBundleIteratively(assetName, bundle) {
  let asset = findAssetBundle(assetName, bundle);

  if (!asset) {
    for (let b of bundle.childBundles) {
      asset = findAssetBundle(assetName, b);
      if (asset) {
        return asset;
      }
    }
  }

  return asset;
}

module.exports = findAssetBundleIteratively;