#!/usr/bin/env node

/**
 * Build Optimization Script
 * Optimizes build output through various techniques including compression,
 * asset optimization, and bundle analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const zlib = require('zlib');

class BuildOptimizer {
  constructor() {
    this.buildDir = path.join(process.cwd(), 'build');
    this.staticDir = path.join(this.buildDir, 'static');
    this.optimizations = {
      gzip: false,
      brotli: false,
      imageOptimization: false,
      cssMinification: false,
      jsMinification: false,
      removeSourceMaps: false,
    };
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      compressionRatio: 0,
      filesProcessed: 0,
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      progress: chalk.cyan,
    };
    console.log(colors[type](`🚀 ${message}`));
  }

  async optimize(options = {}) {
    this.log('Starting build optimization...', 'info');

    // Parse options
    this.optimizations = {
      gzip: options.gzip !== false,
      brotli: options.brotli !== false,
      imageOptimization: options.images !== false,
      cssMinification: options.css !== false,
      jsMinification: options.js !== false,
      removeSourceMaps: options.sourceMaps === false,
      ...options,
    };

    try {
      // Ensure build exists
      if (!fs.existsSync(this.buildDir)) {
        this.log(
          'Build directory not found. Running build first...',
          'warning'
        );
        execSync('npm run build', { stdio: 'inherit' });
      }

      await this.calculateOriginalSize();
      await this.optimizeJavaScript();
      await this.optimizeCSS();
      await this.optimizeImages();
      await this.generateCompressionFiles();
      await this.cleanupSourceMaps();
      await this.generateManifest();
      await this.calculateOptimizedSize();

      this.displayResults();
    } catch (error) {
      this.log(`Optimization failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async calculateOriginalSize() {
    this.log('Calculating original build size...', 'progress');
    this.stats.originalSize = await this.getDirectorySize(this.buildDir);
  }

  async calculateOptimizedSize() {
    this.log('Calculating optimized build size...', 'progress');
    this.stats.optimizedSize = await this.getDirectorySize(this.buildDir);
    this.stats.compressionRatio = (
      ((this.stats.originalSize - this.stats.optimizedSize) /
        this.stats.originalSize) *
      100
    ).toFixed(2);
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    const traverse = (currentPath) => {
      const stats = fs.statSync(currentPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach((file) => {
          traverse(path.join(currentPath, file));
        });
      } else {
        totalSize += stats.size;
      }
    };

    traverse(dirPath);
    return totalSize;
  }

  async optimizeJavaScript() {
    if (!this.optimizations.jsMinification) return;

    this.log('Optimizing JavaScript files...', 'progress');

    const jsDir = path.join(this.staticDir, 'js');
    if (!fs.existsSync(jsDir)) return;

    const jsFiles = fs
      .readdirSync(jsDir)
      .filter((file) => file.endsWith('.js') && !file.endsWith('.min.js'));

    for (const file of jsFiles) {
      const filePath = path.join(jsDir, file);
      const originalContent = fs.readFileSync(filePath, 'utf8');

      try {
        // Use terser for additional minification if not already minified
        const { minify } = require('terser');
        const result = await minify(originalContent, {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
          },
          mangle: true,
          format: {
            comments: false,
          },
        });

        if (result.code && result.code.length < originalContent.length) {
          fs.writeFileSync(filePath, result.code);
          this.stats.filesProcessed++;
          this.log(`Optimized ${file}`, 'success');
        }
      } catch (error) {
        this.log(`Failed to optimize ${file}: ${error.message}`, 'warning');
      }
    }
  }

  async optimizeCSS() {
    if (!this.optimizations.cssMinification) return;

    this.log('Optimizing CSS files...', 'progress');

    const cssDir = path.join(this.staticDir, 'css');
    if (!fs.existsSync(cssDir)) return;

    const cssFiles = fs
      .readdirSync(cssDir)
      .filter((file) => file.endsWith('.css'));

    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file);
      const originalContent = fs.readFileSync(filePath, 'utf8');

      try {
        // Basic CSS optimization
        const optimizedContent = originalContent
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Compress whitespace
          .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
          .replace(/\s*{\s*/g, '{') // Clean up braces
          .replace(/\s*}\s*/g, '}')
          .replace(/\s*,\s*/g, ',') // Clean up commas
          .replace(/\s*;\s*/g, ';'); // Clean up semicolons

        if (optimizedContent.length < originalContent.length) {
          fs.writeFileSync(filePath, optimizedContent);
          this.stats.filesProcessed++;
          this.log(`Optimized ${file}`, 'success');
        }
      } catch (error) {
        this.log(`Failed to optimize ${file}: ${error.message}`, 'warning');
      }
    }
  }

  async optimizeImages() {
    if (!this.optimizations.imageOptimization) return;

    this.log('Optimizing images...', 'progress');

    const mediaDir = path.join(this.staticDir, 'media');
    if (!fs.existsSync(mediaDir)) return;

    const imageFiles = fs
      .readdirSync(mediaDir)
      .filter((file) => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file));

    for (const file of imageFiles) {
      const filePath = path.join(mediaDir, file);
      const stats = fs.statSync(filePath);

      // For now, just log large images that should be optimized
      if (stats.size > 500 * 1024) {
        // > 500KB
        this.log(
          `Large image detected: ${file} (${Math.round(stats.size / 1024)}KB)`,
          'warning'
        );
      }
    }

    // TODO: Implement actual image optimization with sharp or imagemin
    // This would require additional dependencies
  }

  async generateCompressionFiles() {
    this.log('Generating compression files...', 'progress');

    await this.compressFiles(this.buildDir);
  }

  async compressFiles(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        await this.compressFiles(itemPath);
      } else if (this.shouldCompress(item)) {
        await this.compressFile(itemPath);
      }
    }
  }

  shouldCompress(filename) {
    const compressibleExtensions = [
      '.js',
      '.css',
      '.html',
      '.json',
      '.xml',
      '.txt',
      '.svg',
    ];
    const ext = path.extname(filename);
    return (
      compressibleExtensions.includes(ext) &&
      !filename.includes('.gz') &&
      !filename.includes('.br')
    );
  }

  async compressFile(filePath) {
    const content = fs.readFileSync(filePath);

    // Generate gzip
    if (this.optimizations.gzip) {
      const gzipContent = zlib.gzipSync(content, { level: 9 });
      fs.writeFileSync(filePath + '.gz', gzipContent);
    }

    // Generate brotli
    if (this.optimizations.brotli) {
      try {
        const brotliContent = zlib.brotliCompressSync(content, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          },
        });
        fs.writeFileSync(filePath + '.br', brotliContent);
      } catch (error) {
        // Brotli might not be available in older Node versions
        this.log('Brotli compression not available', 'warning');
      }
    }
  }

  async cleanupSourceMaps() {
    if (!this.optimizations.removeSourceMaps) return;

    this.log('Removing source maps...', 'progress');

    const removeSourceMapsFromDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          removeSourceMapsFromDir(itemPath);
        } else if (item.endsWith('.map')) {
          fs.unlinkSync(itemPath);
          this.log(`Removed ${item}`, 'success');
        }
      }
    };

    removeSourceMapsFromDir(this.staticDir);
  }

  async generateManifest() {
    this.log('Generating optimization manifest...', 'progress');

    const manifest = {
      timestamp: new Date().toISOString(),
      optimizations: this.optimizations,
      stats: this.stats,
      files: await this.generateFileManifest(),
    };

    const manifestPath = path.join(this.buildDir, 'optimization-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  async generateFileManifest() {
    const manifest = {};

    const processDirectory = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          processDirectory(itemPath, relativeItemPath);
        } else {
          manifest[relativeItemPath] = {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            compressed: {
              gzip: fs.existsSync(itemPath + '.gz'),
              brotli: fs.existsSync(itemPath + '.br'),
            },
          };
        }
      }
    };

    processDirectory(this.buildDir);
    return manifest;
  }

  displayResults() {
    console.log('\n' + chalk.cyan('🚀 Build Optimization Results'));
    console.log(chalk.cyan('='.repeat(50)));

    console.log(
      `📦 Original Size: ${chalk.yellow(this.formatBytes(this.stats.originalSize))}`
    );
    console.log(
      `📦 Optimized Size: ${chalk.yellow(this.formatBytes(this.stats.optimizedSize))}`
    );
    console.log(
      `📈 Compression Ratio: ${chalk.green(this.stats.compressionRatio + '%')}`
    );
    console.log(
      `🔧 Files Processed: ${chalk.yellow(this.stats.filesProcessed)}`
    );

    console.log('\n' + chalk.cyan('🎯 Optimizations Applied:'));
    Object.entries(this.optimizations).forEach(([key, value]) => {
      const icon = value ? '✅' : '⏭️';
      console.log(`${icon} ${key}: ${value ? 'enabled' : 'skipped'}`);
    });

    console.log('\n' + chalk.green('✅ Optimization complete!'));
    console.log(
      chalk.blue('💡 Check optimization-manifest.json for detailed results')
    );
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse CLI arguments
  args.forEach((arg) => {
    if (arg === '--no-gzip') options.gzip = false;
    if (arg === '--no-brotli') options.brotli = false;
    if (arg === '--no-images') options.images = false;
    if (arg === '--no-css') options.css = false;
    if (arg === '--no-js') options.js = false;
    if (arg === '--remove-source-maps') options.sourceMaps = false;
  });

  const optimizer = new BuildOptimizer();
  optimizer.optimize(options).catch((error) => {
    console.error(chalk.red('❌ Optimization failed:'), error);
    process.exit(1);
  });
}

module.exports = BuildOptimizer;
