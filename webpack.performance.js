const path = require('path');

// Performance optimization configurations
const performanceConfig = {
  development: {
    // Faster builds in development
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

    resolve: {
      // Speed up resolving
      symlinks: false,
    },

    module: {
      // Noop for unused exports in development
      noParse: /[\\/]node_modules[\\/](lodash|moment)[\\/]/,
    },
  },

  production: {
    // Maximum optimization for production
    optimization: {
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',

      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?:[\\/]node_modules[\\/](?:react|react-dom|scheduler|prop-types|use-subscription)[\\/])/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      },
    },

    resolve: {
      // Production optimizations
      alias: {
        // Use production builds
        react: 'react/index.js',
        'react-dom': 'react-dom/index.js',
      },
    },
  },
};

module.exports = performanceConfig;
