/**
 * Custom Webpack Plugin for Chunk Optimization
 * Automatically optimizes chunk splitting and loading strategies
 */

const path = require('path');

class ChunkOptimizationPlugin {
  constructor(options = {}) {
    this.options = {
      // Threshold sizes in bytes
      maxChunkSize: options.maxChunkSize || 250000, // 250KB
      minChunkSize: options.minChunkSize || 20000, // 20KB
      maxAsyncRequests: options.maxAsyncRequests || 5,
      maxInitialRequests: options.maxInitialRequests || 3,

      // Vendor chunk configuration
      vendorChunkSize: options.vendorChunkSize || 500000, // 500KB
      splitVendors: options.splitVendors !== false,

      // Common chunk thresholds
      commonChunkMinSize: options.commonChunkMinSize || 30000, // 30KB
      commonChunkMinChunks: options.commonChunkMinChunks || 2,

      // Preload/prefetch optimization
      enablePreload: options.enablePreload !== false,
      enablePrefetch: options.enablePrefetch !== false,

      // Development mode optimizations
      development:
        options.development || process.env.NODE_ENV === 'development',

      // Caching optimization
      enableLongTermCaching: options.enableLongTermCaching !== false,

      verbose: options.verbose || false,
      ...options,
    };
  }

  apply(compiler) {
    const pluginName = 'ChunkOptimizationPlugin';

    // Optimize splitChunks configuration
    this.optimizeSplitChunks(compiler);

    // Add chunk analysis hooks
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Optimize chunk names for better caching
      if (this.options.enableLongTermCaching) {
        this.optimizeChunkNames(compilation);
      }

      // Add preload/prefetch hints
      if (this.options.enablePreload || this.options.enablePrefetch) {
        this.addResourceHints(compilation);
      }
    });

    // Post-compilation analysis and warnings
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (this.options.verbose) {
        this.analyzeAndReport(stats);
      }
    });
  }

  optimizeSplitChunks(compiler) {
    const optimization = compiler.options.optimization || {};
    const existingSplitChunks = optimization.splitChunks || {};

    // Enhanced split chunks configuration
    const optimizedSplitChunks = {
      chunks: 'all',
      minSize: this.options.minChunkSize,
      maxSize: this.options.maxChunkSize,
      minChunks: 1,
      maxAsyncRequests: this.options.maxAsyncRequests,
      maxInitialRequests: this.options.maxInitialRequests,
      automaticNameDelimiter: '~',
      cacheGroups: {
        // Vendor libraries (highest priority)
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20,
          chunks: 'all',
          maxSize: this.options.vendorChunkSize,
          reuseExistingChunk: true,
          enforce: this.options.splitVendors,
        },

        // React and related libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react',
          priority: 30,
          chunks: 'all',
          reuseExistingChunk: true,
        },

        // UI library chunk (MUI, etc.)
        ui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion|@material-ui)[\\/]/,
          name: 'ui',
          priority: 25,
          chunks: 'all',
          reuseExistingChunk: true,
        },

        // Utility libraries
        utils: {
          test: /[\\/]node_modules[\\/](lodash|date-fns|axios|rxjs)[\\/]/,
          name: 'utils',
          priority: 15,
          chunks: 'all',
          reuseExistingChunk: true,
        },

        // Common application modules
        common: {
          name: 'common',
          minChunks: this.options.commonChunkMinChunks,
          minSize: this.options.commonChunkMinSize,
          priority: 10,
          chunks: 'all',
          reuseExistingChunk: true,
          test: (module) => {
            // Include common app modules but exclude node_modules
            return (
              module.resource &&
              !module.resource.includes('node_modules') &&
              (module.resource.includes('/src/components/') ||
                module.resource.includes('/src/hooks/') ||
                module.resource.includes('/src/utils/') ||
                module.resource.includes('/src/services/'))
            );
          },
        },

        // Default chunk for everything else
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },

        // Merge existing cache groups with optimized ones
        ...existingSplitChunks.cacheGroups,
      },
    };

    // Apply development-specific optimizations
    if (this.options.development) {
      optimizedSplitChunks.cacheGroups.vendor.maxSize = Infinity; // Don't split vendors in dev
      optimizedSplitChunks.maxAsyncRequests = Infinity;
      optimizedSplitChunks.maxInitialRequests = Infinity;
    }

    // Merge with existing configuration
    compiler.options.optimization = {
      ...optimization,
      splitChunks: {
        ...existingSplitChunks,
        ...optimizedSplitChunks,
        cacheGroups: optimizedSplitChunks.cacheGroups,
      },
    };

    if (this.options.verbose) {
      console.log(
        '🔧 ChunkOptimizationPlugin: Applied split chunks configuration'
      );
    }
  }

  optimizeChunkNames(compilation) {
    compilation.hooks.chunkIds.tap('ChunkOptimizationPlugin', (chunks) => {
      const usedIds = new Set();

      for (const chunk of chunks) {
        // Generate stable, descriptive names for better caching
        if (!chunk.id && chunk.name) {
          let id = this.generateStableChunkId(chunk);

          // Ensure uniqueness
          let counter = 1;
          let originalId = id;
          while (usedIds.has(id)) {
            id = `${originalId}-${counter}`;
            counter++;
          }

          chunk.id = id;
          usedIds.add(id);
        }
      }
    });
  }

  generateStableChunkId(chunk) {
    // Generate stable IDs based on chunk content and dependencies
    if (chunk.name) {
      return chunk.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }

    // For unnamed chunks, generate ID based on entry points or modules
    const entryModules = Array.from(chunk.entryModules || []);
    if (entryModules.length > 0) {
      const entryPath = entryModules[0].request || entryModules[0].identifier();
      return this.modulePathToChunkId(entryPath);
    }

    // Fallback to a hash-based approach
    const modules = Array.from(chunk.modulesIterable || []);
    if (modules.length > 0) {
      const firstModule = modules[0];
      return this.modulePathToChunkId(
        firstModule.request || firstModule.identifier()
      );
    }

    return `chunk-${Date.now()}`;
  }

  modulePathToChunkId(modulePath) {
    // Convert module path to a meaningful chunk ID
    return modulePath
      .replace(/.*[\\/]src[\\/]/, '') // Remove everything before /src/
      .replace(/[\\/]/g, '-') // Replace path separators
      .replace(/\.(ts|tsx|js|jsx)$/, '') // Remove file extensions
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove special characters
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  addResourceHints(compilation) {
    compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
      'ChunkOptimizationPlugin',
      (data, callback) => {
        try {
          const chunks = compilation.chunks;
          const preloadChunks = [];
          const prefetchChunks = [];

          chunks.forEach((chunk) => {
            if (chunk.isOnlyInitial()) {
              // Preload critical chunks
              if (this.options.enablePreload && this.shouldPreload(chunk)) {
                preloadChunks.push(...chunk.files);
              }
            } else {
              // Prefetch async chunks
              if (this.options.enablePrefetch && this.shouldPrefetch(chunk)) {
                prefetchChunks.push(...chunk.files);
              }
            }
          });

          // Add resource hints to HTML data
          data.assets.preload = preloadChunks.filter((file) =>
            file.endsWith('.js')
          );
          data.assets.prefetch = prefetchChunks.filter((file) =>
            file.endsWith('.js')
          );

          callback();
        } catch (error) {
          callback(error);
        }
      }
    );
  }

  shouldPreload(chunk) {
    // Preload strategy: small, critical chunks
    const chunkSize = this.estimateChunkSize(chunk);
    return chunkSize < this.options.minChunkSize * 2 && chunk.hasEntryModule();
  }

  shouldPrefetch(chunk) {
    // Prefetch strategy: likely-to-be-needed async chunks
    const chunkSize = this.estimateChunkSize(chunk);
    return (
      chunkSize < this.options.maxChunkSize &&
      chunkSize > this.options.minChunkSize
    );
  }

  estimateChunkSize(chunk) {
    // Rough estimation of chunk size based on modules
    let size = 0;
    if (chunk.modulesIterable) {
      for (const module of chunk.modulesIterable) {
        size += module.size ? module.size() : 1000; // Default estimate
      }
    }
    return size;
  }

  analyzeAndReport(stats) {
    const compilation = stats.compilation;
    const chunks = Array.from(compilation.chunks);

    const analysis = {
      totalChunks: chunks.length,
      oversizedChunks: [],
      undersizedChunks: [],
      vendorChunks: [],
      entryChunks: [],
      asyncChunks: [],
    };

    chunks.forEach((chunk) => {
      const chunkSize = this.getActualChunkSize(chunk, stats);
      const chunkInfo = {
        name: chunk.name || chunk.id,
        size: chunkSize,
        isEntry: chunk.hasEntryModule(),
        isAsync: !chunk.isOnlyInitial(),
        files: Array.from(chunk.files),
      };

      if (chunkSize > this.options.maxChunkSize) {
        analysis.oversizedChunks.push(chunkInfo);
      }

      if (chunkSize < this.options.minChunkSize && chunkInfo.isAsync) {
        analysis.undersizedChunks.push(chunkInfo);
      }

      if (chunkInfo.name && chunkInfo.name.includes('vendor')) {
        analysis.vendorChunks.push(chunkInfo);
      }

      if (chunkInfo.isEntry) {
        analysis.entryChunks.push(chunkInfo);
      }

      if (chunkInfo.isAsync) {
        analysis.asyncChunks.push(chunkInfo);
      }
    });

    this.reportAnalysis(analysis);
  }

  getActualChunkSize(chunk, stats) {
    const assets = stats.compilation.assets;
    let totalSize = 0;

    chunk.files.forEach((filename) => {
      if (assets[filename]) {
        totalSize += assets[filename].size();
      }
    });

    return totalSize;
  }

  reportAnalysis(analysis) {
    console.log('\n🚀 Chunk Optimization Analysis:');
    console.log(`📊 Total chunks: ${analysis.totalChunks}`);
    console.log(`📈 Entry chunks: ${analysis.entryChunks.length}`);
    console.log(`🔄 Async chunks: ${analysis.asyncChunks.length}`);
    console.log(`📦 Vendor chunks: ${analysis.vendorChunks.length}`);

    if (analysis.oversizedChunks.length > 0) {
      console.log(
        `\n⚠️  Oversized chunks (>${this.formatBytes(this.options.maxChunkSize)}):`
      );
      analysis.oversizedChunks.forEach((chunk) => {
        console.log(`   - ${chunk.name}: ${this.formatBytes(chunk.size)}`);
      });
      console.log('   💡 Consider further splitting these chunks');
    }

    if (analysis.undersizedChunks.length > 3) {
      console.log(
        `\n📉 Small async chunks (<${this.formatBytes(this.options.minChunkSize)}):`
      );
      analysis.undersizedChunks.slice(0, 5).forEach((chunk) => {
        console.log(`   - ${chunk.name}: ${this.formatBytes(chunk.size)}`);
      });
      console.log(
        '   💡 Consider merging small chunks to reduce HTTP requests'
      );
    }

    if (analysis.vendorChunks.length > 0) {
      console.log('\n📚 Vendor chunks:');
      analysis.vendorChunks.forEach((chunk) => {
        console.log(`   - ${chunk.name}: ${this.formatBytes(chunk.size)}`);
      });
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = ChunkOptimizationPlugin;
