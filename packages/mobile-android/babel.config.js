// P40 (mvp1-05): expo-router/babel deprecated in SDK 50+, replaced by babel-preset-expo.
// Без этого metro bundler падает с SyntaxError при createBundleReleaseJsAndAssets.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};