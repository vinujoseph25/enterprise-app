#!/usr/bin/env node

/**
 * Chunk Performance Testing Script
 * Tests chunk loading performance, caching behavior, and optimization effectiveness
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const chalk = require('chalk');

class ChunkPerformanceTester {
  constructor() {
    this.buildDir = path.join(process.cwd(), 'build');
    this.staticDir = path.join(this.buildDir, 'static');
    this.jsDir = path.join(this.staticDir, 'js');
    this.testResults = {
      timestamp: new Date().toISOString(),
      chunks: [],
      performance: {},
      recommendations: [],
      scores: {},
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
    console.log(colors[type](`🧪 ${message}`));
  }

  async runTests() {
    this.log('Starting chunk performance tests...', 'info');

    try {
      if (!fs.existsSync(this.buildDir)) {
        this.log('Build directory not found. Please run build first.', 'error');
        process.exit(1);
      }

      await this.analyzeChunks();
      await this.testLoadingPerformance();
      await this.testCacheability();
      await this.testCompressionRatio();
      await this.testChunkSizes();
      await this.testDependencyGraph();
      await this.calculateScores();
      await this.generateRecommendations();
      await this.saveResults();

      this.displayResults();
    } catch (error) {
      this.log(`Testing failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async analyzeChunks() {
    this.log('Analyzing chunk structure...', 'progress');

    if (!fs.existsSync(this.jsDir)) {
      this.log('No JavaScript chunks found', 'warning');
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
          type: this.identifyChunkType(file),
          hasSourceMap: fs.existsSync(filePath + '.map'),
          hasGzip: fs.existsSync(filePath + '.gz'),
          hasBrotli: fs.existsSync(filePath + '.br'),
          content: fs.readFileSync(filePath, 'utf8'),
        };
      })
      .sort((a, b) => b.size - a.size);

    this.testResults.chunks = jsFiles;
  }

  identifyChunkType(filename) {
    if (filename.includes('main')) return 'main';
    if (filename.includes('vendor') || filename.includes('node_modules'))
      return 'vendor';
    if (filename.includes('runtime')) return 'runtime';
    if (filename.match(/^\d+\./)) return 'async';
    if (filename.includes('chunk')) return 'chunk';
    return 'unknown';
  }

  async testLoadingPerformance() {
    this.log('Testing chunk loading performance...', 'progress');

    const loadingTests = [];

    for (const chunk of this.testResults.chunks) {
      const startTime = performance.now();

      try {
        // Simulate chunk loading time based on size
        const simulatedLoadTime = this.calculateLoadTime(chunk.size);

        // Parse time simulation (based on chunk complexity)
        const parseTime = this.calculateParseTime(chunk.content);

        const endTime = performance.now();
        const actualProcessingTime = endTime - startTime;

        loadingTests.push({
          chunk: chunk.name,
          size: chunk.sizeKB,
          simulatedLoadTime,
          parseTime,
          processingTime: actualProcessingTime,
          score: this.calculatePerformanceScore(
            simulatedLoadTime,
            parseTime,
            chunk.sizeKB
          ),
        });
      } catch (error) {
        this.log(
          `Failed to test chunk ${chunk.name}: ${error.message}`,
          'warning'
        );
      }
    }

    this.testResults.performance.loading = loadingTests;
  }

  calculateLoadTime(sizeBytes) {
    // Simulate different connection speeds (in ms)
    const connections = {
      '3g': (sizeBytes / ((1.6 * 1024 * 1024) / 8)) * 1000, // 1.6 Mbps
      '4g': (sizeBytes / ((10 * 1024 * 1024) / 8)) * 1000, // 10 Mbps
      wifi: (sizeBytes / ((50 * 1024 * 1024) / 8)) * 1000, // 50 Mbps
    };

    return connections;
  }

  calculateParseTime(content) {
    // Estimate parse time based on content complexity
    const lines = content.split('\n').length;
    const complexity = (content.match(/function|class|const|let|var/g) || [])
      .length;

    // Rough estimation: 0.1ms per line + 0.05ms per declaration
    return lines * 0.1 + complexity * 0.05;
  }

  calculatePerformanceScore(loadTimes, parseTime, sizeKB) {
    const avgLoadTime =
      (loadTimes['3g'] + loadTimes['4g'] + loadTimes['wifi']) / 3;
    const totalTime = avgLoadTime + parseTime;

    // Score based on total time and size efficiency
    let score = 100;
    if (totalTime > 1000) score -= 30; // > 1 second
    if (totalTime > 500) score -= 20; // > 500ms
    if (sizeKB > 500) score -= 20; // > 500KB
    if (sizeKB > 1000) score -= 30; // > 1MB

    return Math.max(0, score);
  }

  async testCacheability() {
    this.log('Testing cacheability and versioning...', 'progress');

    const cacheTests = this.testResults.chunks.map((chunk) => {
      const hasContentHash = /\.[a-f0-9]{8,}\./i.test(chunk.name);
      const isVendor = chunk.type === 'vendor';
      const isMain = chunk.type === 'main';

      let cacheScore = 0;
      let recommendations = [];

      if (hasContentHash) {
        cacheScore += 40;
      } else {
        recommendations.push('Add content hash for better caching');
      }

      if (isVendor && chunk.sizeKB > 100) {
        cacheScore += 30;
        recommendations.push('Good vendor chunk separation for caching');
      }

      if (isMain && chunk.sizeKB < 200) {
        cacheScore += 20;
      } else if (isMain) {
        recommendations.push('Main chunk is large, consider code splitting');
      }

      if (chunk.hasGzip) cacheScore += 5;
      if (chunk.hasBrotli) cacheScore += 5;

      return {
        chunk: chunk.name,
        hasContentHash,
        cacheScore: Math.min(100, cacheScore),
        recommendations,
      };
    });

    this.testResults.performance.caching = cacheTests;
  }

  async testCompressionRatio() {
    this.log('Testing compression efficiency...', 'progress');

    const compressionTests = [];

    for (const chunk of this.testResults.chunks) {
      const originalSize = chunk.size;
      let gzipSize = null;
      let brotliSize = null;

      if (chunk.hasGzip) {
        try {
          const gzipPath = chunk.path + '.gz';
          gzipSize = fs.statSync(gzipPath).size;
        } catch (error) {
          // Gzip file might not exist
        }
      }

      if (chunk.hasBrotli) {
        try {
          const brotliPath = chunk.path + '.br';
          brotliSize = fs.statSync(brotliPath).size;
        } catch (error) {
          // Brotli file might not exist
        }
      }

      const gzipRatio = gzipSize
        ? ((originalSize - gzipSize) / originalSize) * 100
        : null;
      const brotliRatio = brotliSize
        ? ((originalSize - brotliSize) / originalSize) * 100
        : null;

      compressionTests.push({
        chunk: chunk.name,
        originalSize: Math.round(originalSize / 1024),
        gzipSize: gzipSize ? Math.round(gzipSize / 1024) : null,
        brotliSize: brotliSize ? Math.round(brotliSize / 1024) : null,
        gzipRatio: gzipRatio ? Math.round(gzipRatio) : null,
        brotliRatio: brotliRatio ? Math.round(brotliRatio) : null,
        compressionScore: this.calculateCompressionScore(
          gzipRatio,
          brotliRatio
        ),
      });
    }

    this.testResults.performance.compression = compressionTests;
  }

  calculateCompressionScore(gzipRatio, brotliRatio) {
    let score = 0;

    if (gzipRatio !== null) {
      if (gzipRatio > 70) score += 40;
      else if (gzipRatio > 50) score += 30;
      else if (gzipRatio > 30) score += 20;
      else score += 10;
    }

    if (brotliRatio !== null) {
      if (brotliRatio > 75) score += 30;
      else if (brotliRatio > 55) score += 20;
      else if (brotliRatio > 35) score += 15;
      else score += 10;
    }

    if (gzipRatio === null && brotliRatio === null) {
      score = 0; // No compression
    }

    return Math.min(100, score);
  }

  async testChunkSizes() {
    this.log('Testing chunk size optimization...', 'progress');

    const sizeTests = this.testResults.chunks.map((chunk) => {
      let sizeScore = 100;
      const recommendations = [];

      // Size-based scoring
      if (chunk.sizeKB > 1000) {
        sizeScore -= 40;
        recommendations.push('Chunk is very large (>1MB), consider splitting');
      } else if (chunk.sizeKB > 500) {
        sizeScore -= 25;
        recommendations.push('Chunk is large (>500KB), consider optimization');
      } else if (chunk.sizeKB > 250) {
        sizeScore -= 15;
        recommendations.push('Chunk is moderately large, monitor size growth');
      }

      // Type-specific recommendations
      if (chunk.type === 'main' && chunk.sizeKB > 200) {
        recommendations.push(
          'Main bundle is large, implement route-based splitting'
        );
      }

      if (chunk.type === 'vendor' && chunk.sizeKB > 800) {
        recommendations.push(
          'Vendor bundle is large, consider vendor splitting'
        );
      }

      if (chunk.sizeKB < 10) {
        sizeScore -= 10;
        recommendations.push('Very small chunk, consider bundling with others');
      }

      return {
        chunk: chunk.name,
        type: chunk.type,
        sizeKB: chunk.sizeKB,
        sizeScore: Math.max(0, sizeScore),
        recommendations,
      };
    });

    this.testResults.performance.sizes = sizeTests;
  }

  async testDependencyGraph() {
    this.log('Analyzing dependency relationships...', 'progress');

    const dependencyAnalysis = {
      totalChunks: this.testResults.chunks.length,
      chunkTypes: {},
      asyncChunks: 0,
      vendorChunks: 0,
      mainChunks: 0,
    };

    this.testResults.chunks.forEach((chunk) => {
      const type = chunk.type;
      dependencyAnalysis.chunkTypes[type] =
        (dependencyAnalysis.chunkTypes[type] || 0) + 1;

      if (type === 'async') dependencyAnalysis.asyncChunks++;
      if (type === 'vendor') dependencyAnalysis.vendorChunks++;
      if (type === 'main') dependencyAnalysis.mainChunks++;
    });

    // Calculate dependency score
    let dependencyScore = 50;

    if (dependencyAnalysis.vendorChunks > 0) dependencyScore += 20;
    if (dependencyAnalysis.asyncChunks > 2) dependencyScore += 20;
    if (dependencyAnalysis.mainChunks === 1) dependencyScore += 10;
    if (
      dependencyAnalysis.totalChunks >= 3 &&
      dependencyAnalysis.totalChunks <= 15
    ) {
      dependencyScore += 10;
    }

    this.testResults.performance.dependencies = {
      ...dependencyAnalysis,
      dependencyScore: Math.min(100, dependencyScore),
    };
  }

  async calculateScores() {
    this.log('Calculating overall performance scores...', 'progress');

    const scores = {};

    // Overall loading performance
    const loadingScores = this.testResults.performance.loading?.map(
      (test) => test.score
    ) || [0];
    scores.loading = Math.round(
      loadingScores.reduce((a, b) => a + b, 0) / loadingScores.length
    );

    // Caching performance
    const cachingScores = this.testResults.performance.caching?.map(
      (test) => test.cacheScore
    ) || [0];
    scores.caching = Math.round(
      cachingScores.reduce((a, b) => a + b, 0) / cachingScores.length
    );

    // Compression performance
    const compressionScores = this.testResults.performance.compression?.map(
      (test) => test.compressionScore
    ) || [0];
    scores.compression = Math.round(
      compressionScores.reduce((a, b) => a + b, 0) / compressionScores.length
    );

    // Size optimization
    const sizeScores = this.testResults.performance.sizes?.map(
      (test) => test.sizeScore
    ) || [0];
    scores.sizes = Math.round(
      sizeScores.reduce((a, b) => a + b, 0) / sizeScores.length
    );

    // Dependency structure
    scores.dependencies =
      this.testResults.performance.dependencies?.dependencyScore || 0;

    // Overall score (weighted average)
    scores.overall = Math.round(
      scores.loading * 0.3 +
        scores.caching * 0.2 +
        scores.compression * 0.2 +
        scores.sizes * 0.2 +
        scores.dependencies * 0.1
    );

    this.testResults.scores = scores;
  }

  async generateRecommendations() {
    this.log('Generating optimization recommendations...', 'progress');

    const recommendations = [];
    const { scores } = this.testResults;

    // Performance-based recommendations
    if (scores.loading < 70) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Poor chunk loading performance',
        solution: 'Implement code splitting and reduce chunk sizes',
      });
    }

    if (scores.caching < 60) {
      recommendations.push({
        category: 'Caching',
        priority: 'High',
        issue: 'Poor caching strategy',
        solution:
          'Add content hashes and optimize chunk splitting for better caching',
      });
    }

    if (scores.compression < 50) {
      recommendations.push({
        category: 'Compression',
        priority: 'Medium',
        issue: 'Poor compression ratios',
        solution:
          'Enable gzip/brotli compression and optimize code for better compression',
      });
    }

    if (scores.sizes < 60) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'High',
        issue: 'Large chunk sizes detected',
        solution: 'Implement aggressive code splitting and tree shaking',
      });
    }

    if (scores.dependencies < 50) {
      recommendations.push({
        category: 'Architecture',
        priority: 'Medium',
        issue: 'Suboptimal chunk structure',
        solution: 'Optimize webpack splitting strategy and vendor separation',
      });
    }

    // Overall score recommendations
    if (scores.overall < 60) {
      recommendations.push({
        category: 'General',
        priority: 'High',
        issue: 'Overall performance needs improvement',
        solution: 'Review and implement multiple optimization strategies',
      });
    }

    this.testResults.recommendations = recommendations;
  }

  async saveResults() {
    const reportPath = path.join(
      process.cwd(),
      'chunk-performance-report.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    this.log(`Results saved to ${reportPath}`, 'success');
  }

  displayResults() {
    console.log('\n' + chalk.cyan('🧪 Chunk Performance Test Results'));
    console.log(chalk.cyan('='.repeat(50)));

    const { scores } = this.testResults;

    console.log(
      `📊 Overall Score: ${this.getScoreColor(scores.overall)(scores.overall + '/100')}`
    );
    console.log(
      `⚡ Loading Performance: ${this.getScoreColor(scores.loading)(scores.loading + '/100')}`
    );
    console.log(
      `💾 Caching Strategy: ${this.getScoreColor(scores.caching)(scores.caching + '/100')}`
    );
    console.log(
      `🗜️  Compression Ratio: ${this.getScoreColor(scores.compression)(scores.compression + '/100')}`
    );
    console.log(
      `📦 Bundle Sizes: ${this.getScoreColor(scores.sizes)(scores.sizes + '/100')}`
    );
    console.log(
      `🔗 Dependencies: ${this.getScoreColor(scores.dependencies)(scores.dependencies + '/100')}`
    );

    console.log('\n' + chalk.cyan('📈 Chunk Analysis:'));
    console.log(
      `Total Chunks: ${chalk.yellow(this.testResults.chunks.length)}`
    );

    const chunksByType = this.testResults.chunks.reduce((acc, chunk) => {
      acc[chunk.type] = (acc[chunk.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(chunksByType).forEach(([type, count]) => {
      console.log(`${type}: ${chalk.yellow(count)}`);
    });

    if (this.testResults.recommendations.length > 0) {
      console.log('\n' + chalk.cyan('💡 Recommendations:'));
      this.testResults.recommendations.forEach((rec) => {
        const priorityColor =
          rec.priority === 'High'
            ? chalk.red
            : rec.priority === 'Medium'
              ? chalk.yellow
              : chalk.blue;
        console.log(`${priorityColor('●')} [${rec.category}] ${rec.issue}`);
        console.log(`   ${chalk.gray(rec.solution)}`);
      });
    }

    console.log('\n' + chalk.green('✅ Chunk performance testing complete!'));
    console.log(
      chalk.blue('💡 Check chunk-performance-report.json for detailed results')
    );
  }

  getScoreColor(score) {
    if (score >= 80) return chalk.green;
    if (score >= 60) return chalk.yellow;
    return chalk.red;
  }
}

// CLI execution
if (require.main === module) {
  const tester = new ChunkPerformanceTester();
  tester.runTests().catch((error) => {
    console.error(chalk.red('❌ Testing failed:'), error);
    process.exit(1);
  });
}

module.exports = ChunkPerformanceTester;
