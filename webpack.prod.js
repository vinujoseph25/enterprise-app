const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',

  devtool: 'source-map',

  output: {
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'static/media/[name].[hash][ext]',
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
          },
          mangle: {
            safari10: true,
          },
          format: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],

    // Advanced code splitting for production
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,

      cacheGroups: {
        // React and core libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react-vendor',
          chunks: 'all',
          priority: 40,
          enforce: true,
        },

        // MUI and styling libraries
        mui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
          name: 'mui-vendor',
          chunks: 'all',
          priority: 35,
          enforce: true,
        },

        // Redux and state management
        redux: {
          test: /[\\/]node_modules[\\/](@reduxjs|react-redux|@tanstack|immer)[\\/]/,
          name: 'state-vendor',
          chunks: 'all',
          priority: 30,
          enforce: true,
        },

        // Data visualization libraries
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3|echarts|ag-grid)[\\/]/,
          name: 'charts-vendor',
          chunks: 'all',
          priority: 25,
          enforce: true,
        },

        // Form and validation libraries
        forms: {
          test: /[\\/]node_modules[\\/](formik|yup|react-hook-form)[\\/]/,
          name: 'forms-vendor',
          chunks: 'all',
          priority: 20,
          enforce: true,
        },

        // i18n libraries
        i18n: {
          test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/,
          name: 'i18n-vendor',
          chunks: 'all',
          priority: 15,
          enforce: true,
        },

        // Animation libraries
        animations: {
          test: /[\\/]node_modules[\\/](framer-motion|react-spring|lottie)[\\/]/,
          name: 'animations-vendor',
          chunks: 'all',
          priority: 15,
          enforce: true,
        },

        // Utility libraries
        utils: {
          test: /[\\/]node_modules[\\/](lodash|date-fns|moment|axios)[\\/]/,
          name: 'utils-vendor',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },

        // Default vendor chunk for remaining node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 5,
          minChunks: 2,
        },

        // Common application code
        common: {
          test: /[\\/]src[\\/]/,
          name: 'common',
          chunks: 'all',
          priority: 1,
          minChunks: 2,
          maxSize: 100000,
        },
      },
    },

    // Runtime chunk optimization
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    },

    // Module concatenation for better tree shaking
    concatenateModules: true,

    // Side effects optimization
    sideEffects: false,
  },

  module: {
    rules: [
      // CSS extraction for production
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: false,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: false,
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },

  plugins: [
    // Clean build directory
    new CleanWebpackPlugin(),

    // Extract CSS
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),

    // Gzip compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),

    // Service worker for caching
    new WorkboxWebpackPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5000000,
      exclude: [/\.map$/, /asset-manifest\.json$/],

      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets',
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          urlPattern: /^https:\/\/api\./,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
          },
        },
      ],
    }),
  ],

  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    hints: 'warning',
  },

  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
    entrypoints: false,
    children: false,
  },
});
