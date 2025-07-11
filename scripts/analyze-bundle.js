#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes webpack bundle composition, dependencies, and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), 'build');
    this.staticDir = path.join(this.buildDir, 'static');
    this.jsDir = path.join(this.staticDir, 'js');
    this.cssDir = path.join(this.staticDir, 'css');
    this.analysisReport = {
      timestamp: new Date().toISOString(),
      totalSize: 0,
      chunks: [],
      recommendations: [],
      performance: {},
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };
    console.log(colors[type](`📊 ${message}`));
  }

  async analyze() {
    this.log('Starting bundle analysis...', 'info');

    try {
      // Check if build directory exists
      if (!fs.existsSync(this.buildDir)) {
        this.log(
          'Build directory not found. Running build first...',
          'warning'
        );
        execSync('npm run build', { stdio: 'inherit' });
      }

      await this.analyzeJSFiles();
      await this.analyzeCSSFiles();
      await this.analyzeAssets();
      await this.checkDuplicates();
      await this.analyzePerformance();
      await this.generateRecommendations();
      await this.saveReport();

      this.displaySummary();
    } catch (error) {
      this.log(`Analysis failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async analyzeJSFiles() {
    this.log('Analyzing JavaScript files...', 'info');

    if (!fs.existsSync(this.jsDir)) {
      this.log('No JavaScript files found', 'warning');
      return;
    }

    const jsFiles = fs
      .readdirSync(this.jsDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => {
        const filePath = path.join(this.jsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          type: this.getChunkType(file),
        };
      })
      .sort((a, b) => b.size - a.size);

    this.analysisReport.chunks = jsFiles;
    this.analysisReport.totalSize += jsFiles.reduce(
      (total, file) => total + file.size,
      0
    );

    jsFiles.forEach((file) => {
      if (file.sizeKB > 1000) {
        this.analysisReport.recommendations.push({
          type: 'size',
          severity: 'high',
          message: `Large chunk detected: ${file.name} (${file.sizeKB}KB). Consider code splitting.`,
        });
      }
    });
  }

  async analyzeCSSFiles() {
    this.log('Analyzing CSS files...', 'info');

    if (!fs.existsSync(this.cssDir)) {
      this.log('No CSS files found', 'warning');
      return;
    }

    const cssFiles = fs
      .readdirSync(this.cssDir)
      .filter((file) => file.endsWith('.css'))
      .map((file) => {
        const filePath = path.join(this.cssDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
        };
      });

    this.analysisReport.css = cssFiles;
    this.analysisReport.totalSize += cssFiles.reduce(
      (total, file) => total + file.size,
      0
    );
  }

  async analyzeAssets() {
    this.log('Analyzing static assets...', 'info');

    const mediaDir = path.join(this.staticDir, 'media');
    if (!fs.existsSync(mediaDir)) return;

    const assets = fs
      .readdirSync(mediaDir)
      .map((file) => {
        const filePath = path.join(mediaDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          type: path.extname(file),
        };
      })
      .sort((a, b) => b.size - a.size);

    this.analysisReport.assets = assets;
    this.analysisReport.totalSize += assets.reduce(
      (total, file) => total + file.size,
      0
    );

    // Check for large assets
    assets.forEach((asset) => {
      if (asset.sizeKB > 500) {
        this.analysisReport.recommendations.push({
          type: 'asset',
          severity: 'medium',
          message: `Large asset detected: ${asset.name} (${asset.sizeKB}KB). Consider optimization.`,
        });
      }
    });
  }

  async checkDuplicates() {
    this.log('Checking for potential duplicates...', 'info');

    try {
      // Use webpack-bundle-analyzer to detect duplicates
      const { execSync } = require('child_process');
      execSync(
        'npx webpack-bundle-analyzer build/static/js/*.js --mode static --report duplicate-analysis.html --no-open',
        { stdio: 'pipe' }
      );

      this.analysisReport.recommendations.push({
        type: 'duplicates',
        severity: 'info',
        message:
          'Duplicate analysis completed. Check duplicate-analysis.html for details.',
      });
    } catch (error) {
      this.log('Could not run duplicate analysis', 'warning');
    }
  }

  async analyzePerformance() {
    this.log('Analyzing performance metrics...', 'info');

    const mainChunk = this.analysisReport.chunks.find(
      (chunk) => chunk.name.includes('main') || chunk.type === 'main'
    );

    const vendorChunks = this.analysisReport.chunks.filter(
      (chunk) => chunk.type === 'vendor' || chunk.name.includes('vendor')
    );

    this.analysisReport.performance = {
      mainChunkSize: mainChunk ? mainChunk.sizeKB : 0,
      vendorChunkSize: vendorChunks.reduce(
        (total, chunk) => total + chunk.sizeKB,
        0
      ),
      totalChunks: this.analysisReport.chunks.length,
      totalSizeKB: Math.round(this.analysisReport.totalSize / 1024),
    };

    // Performance recommendations
    if (this.analysisReport.performance.mainChunkSize > 500) {
      this.analysisReport.recommendations.push({
        type: 'performance',
        severity: 'high',
        message:
          'Main chunk is too large. Implement route-based code splitting.',
      });
    }

    if (this.analysisReport.performance.vendorChunkSize > 1000) {
      this.analysisReport.recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: 'Vendor chunk is large. Consider splitting vendor libraries.',
      });
    }
  }

  async generateRecommendations() {
    this.log('Generating optimization recommendations...', 'info');

    const { performance } = this.analysisReport;

    // Size-based recommendations
    if (performance.totalSizeKB > 3000) {
      this.analysisReport.recommendations.push({
        type: 'optimization',
        severity: 'high',
        message:
          'Total bundle size is very large. Implement aggressive code splitting and tree shaking.',
      });
    }

    // Chunk count recommendations
    if (performance.totalChunks < 3) {
      this.analysisReport.recommendations.push({
        type: 'optimization',
        severity: 'medium',
        message:
          'Too few chunks. Consider implementing route-based and vendor splitting.',
      });
    }

    if (performance.totalChunks > 20) {
      this.analysisReport.recommendations.push({
        type: 'optimization',
        severity: 'medium',
        message:
          'Too many chunks may impact HTTP/2 performance. Consider consolidating smaller chunks.',
      });
    }
  }

  getChunkType(filename) {
    if (filename.includes('main')) return 'main';
    if (filename.includes('vendor') || filename.includes('chunk'))
      return 'vendor';
    if (filename.includes('runtime')) return 'runtime';
    if (filename.match(/\d+\./)) return 'async';
    return 'unknown';
  }

  async saveReport() {
    const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.analysisReport, null, 2));
    this.log(`Report saved to ${reportPath}`, 'success');
  }

  displaySummary() {
    console.log('\n' + chalk.cyan('📊 Bundle Analysis Summary'));
    console.log(chalk.cyan('='.repeat(50)));

    console.log(
      `📦 Total Size: ${chalk.yellow(this.analysisReport.performance.totalSizeKB + 'KB')}`
    );
    console.log(
      `🧩 Total Chunks: ${chalk.yellow(this.analysisReport.performance.totalChunks)}`
    );
    console.log(
      `📄 Main Chunk: ${chalk.yellow(this.analysisReport.performance.mainChunkSize + 'KB')}`
    );
    console.log(
      `📚 Vendor Size: ${chalk.yellow(this.analysisReport.performance.vendorChunkSize + 'KB')}`
    );

    console.log('\n' + chalk.cyan('🎯 Top 5 Largest Chunks:'));
    this.analysisReport.chunks.slice(0, 5).forEach((chunk, index) => {
      console.log(
        `${index + 1}. ${chunk.name} - ${chalk.yellow(chunk.sizeKB + 'KB')}`
      );
    });

    if (this.analysisReport.recommendations.length > 0) {
      console.log('\n' + chalk.cyan('💡 Recommendations:'));
      this.analysisReport.recommendations.forEach((rec, index) => {
        const icon =
          rec.severity === 'high'
            ? '🔴'
            : rec.severity === 'medium'
              ? '🟡'
              : '🔵';
        console.log(`${icon} ${rec.message}`);
      });
    }

    console.log('\n' + chalk.green('✅ Analysis complete!'));
    console.log(
      chalk.blue('💡 Run "npm run analyze:bundle" to open interactive analyzer')
    );
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch((error) => {
    console.error(chalk.red('❌ Analysis failed:'), error);
    process.exit(1);
  });
}

module.exports = BundleAnalyzer;
