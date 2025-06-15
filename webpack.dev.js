const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',

  devtool: 'eval-source-map',

  output: {
    filename: 'static/js/[name].bundle.js',
    chunkFilename: 'static/js/[name].chunk.js',
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,

        // Simplified splitting for development - faster builds
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },

        // Common application code
        common: {
          test: /[\\/]src[\\/]/,
          name: 'common',
          chunks: 'all',
          priority: 5,
          minChunks: 2,
        },
      },
    },

    // Simple runtime chunk for development
    runtimeChunk: 'single',
  },

  plugins: [
    // Hot Module Replacement
    new webpack.HotModuleReplacementPlugin(),

    // Better error messages
    new webpack.NamedModulesPlugin(),
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    compress: true,
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
    proxy: {
      '/api': {
        target: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Fast refresh configuration
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: false,
            plugins: [
              // React Fast Refresh
              require.resolve('react-refresh/babel'),
            ],
          },
        },
      },
    ],
  },

  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
    entrypoints: false,
    warnings: false,
  },
});
