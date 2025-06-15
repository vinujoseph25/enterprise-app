const { merge } = require('webpack-merge');
const prod = require('./webpack.prod.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = merge(prod, {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true,
      reportFilename: '../reports/bundle-analysis.html',
      generateStatsFile: true,
      statsFilename: '../reports/webpack-stats.json',
      statsOptions: {
        source: false,
        reasons: true,
        chunks: true,
        chunkModules: true,
        chunkOrigins: true,
        modules: true,
        cached: true,
        cachedAssets: true,
        assets: true,
        groupAssetsByEmitStatus: true,
        groupAssetsByInfo: true,
        groupAssetsByPath: true,
        assetsSort: 'size',
        modulesSort: 'size',
        chunksSort: 'size',
      },
    }),
  ],

  // More detailed stats for analysis
  stats: {
    all: false,
    assets: true,
    assetsSort: 'size',
    chunks: true,
    chunkModules: true,
    chunkOrigins: true,
    modules: true,
    modulesSort: 'size',
    reasons: true,
    source: false,
    warnings: true,
    errors: true,
  },
});
