/**
 * Custom Webpack Plugin for Chunk Analysis
 * Analyzes bundle chunks and provides optimization insights
 */

const path = require('path');
const fs = require('fs');

class ChunkAnalyzerPlugin {
  constructor(options = {}) {
    this.options = {
      outputPath: options.outputPath || 'reports',
      filename: options.filename || 'chunk-analysis.json',
      minChunkSize: options.minChunkSize || 10000, // 10KB
      verbose: options.verbose || false,
      threshold: options.threshold || 500000, // 500KB
      ...options,
    };
  }

  apply(compiler) {
    const pluginName = 'ChunkAnalyzerPlugin';

    compiler.hooks.done.tapAsync(pluginName, (stats, callback) => {
      try {
        const compilation = stats.compilation;
        const chunks = compilation.chunks;
        const assets = compilation.assets;

        const analysis = this.analyzeChunks(chunks, assets, stats);
        this.generateReport(analysis);

        if (this.options.verbose) {
          this.logAnalysis(analysis);
        }

        callback();
      } catch (error) {
        console.error('ChunkAnalyzerPlugin error:', error);
        callback(error);
      }
    });
  }

  analyzeChunks(chunks, assets, stats) {
    const chunkData = [];
    const duplicateModules = new Map();
    const oversizedChunks = [];
    let totalSize = 0;

    chunks.forEach((chunk) => {
      const chunkFiles = Array.from(chunk.files);
      let chunkSize = 0;

      // Calculate chunk size
      chunkFiles.forEach((filename) => {
        if (assets[filename]) {
          chunkSize += assets[filename].size();
        }
      });

      totalSize += chunkSize;

      const chunkInfo = {
        id: chunk.id,
        name: chunk.name || `chunk-${chunk.id}`,
        size: chunkSize,
        sizeFormatted: this.formatBytes(chunkSize),
        files: chunkFiles,
        modules: this.getChunkModules(chunk),
        parents: Array.from(chunk.getAllReferencedChunks()).map((c) => c.id),
        children: Array.from(chunk.getAllInitialChunks()).map((c) => c.id),
        entryModule: chunk.entryModule ? chunk.entryModule.request : null,
        isAsync: !chunk.isOnlyInitial(),
        reason: chunk.chunkReason,
      };

      // Check for oversized chunks
      if (chunkSize > this.options.threshold) {
        oversizedChunks.push(chunkInfo);
      }

      // Analyze modules for duplicates
      chunkInfo.modules.forEach((module) => {
        if (duplicateModules.has(module.name)) {
          duplicateModules.get(module.name).chunks.push(chunk.id);
        } else {
          duplicateModules.set(module.name, {
            name: module.name,
            size: module.size,
            chunks: [chunk.id],
          });
        }
      });

      chunkData.push(chunkInfo);
    });

    // Filter duplicate modules (appearing in multiple chunks)
    const actualDuplicates = Array.from(duplicateModules.values())
      .filter((module) => module.chunks.length > 1)
      .sort((a, b) => b.size - a.size);

    return {
      timestamp: new Date().toISOString(),
      totalChunks: chunks.size,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      averageChunkSize: Math.round(totalSize / chunks.size),
      chunks: chunkData.sort((a, b) => b.size - a.size),
      oversizedChunks,
      duplicateModules: actualDuplicates,
      recommendations: this.generateRecommendations(
        chunkData,
        actualDuplicates,
        oversizedChunks
      ),
      performance: {
        largestChunk: chunkData.reduce(
          (max, chunk) => (chunk.size > max.size ? chunk : max),
          chunkData[0]
        ),
        smallestChunk: chunkData.reduce(
          (min, chunk) => (chunk.size < min.size ? chunk : min),
          chunkData[0]
        ),
        asyncChunks: chunkData.filter((chunk) => chunk.isAsync).length,
        syncChunks: chunkData.filter((chunk) => !chunk.isAsync).length,
      },
    };
  }

  getChunkModules(chunk) {
    const modules = [];

    if (chunk.getModules) {
      chunk.getModules().forEach((module) => {
        modules.push({
          name: module.request || module.identifier(),
          size: module.size(),
          type: module.type,
          built: module.built,
          cached: module.cached,
        });
      });
    }

    return modules.sort((a, b) => b.size - a.size);
  }

  generateRecommendations(chunks, duplicates, oversizedChunks) {
    const recommendations = [];

    // Oversized chunk recommendations
    if (oversizedChunks.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'bundle-size',
        message: `Found ${oversizedChunks.length} oversized chunks (>${this.formatBytes(this.options.threshold)})`,
        chunks: oversizedChunks.map((c) => c.name),
        suggestion:
          'Consider code splitting these chunks further or lazy loading them.',
      });
    }

    // Duplicate module recommendations
    if (duplicates.length > 0) {
      const significantDuplicates = duplicates.filter(
        (d) => d.size > this.options.minChunkSize
      );
      if (significantDuplicates.length > 0) {
        recommendations.push({
          type: 'optimization',
          category: 'code-duplication',
          message: `Found ${significantDuplicates.length} modules duplicated across chunks`,
          modules: significantDuplicates.slice(0, 10).map((d) => ({
            name: d.name,
            size: this.formatBytes(d.size),
            chunks: d.chunks,
          })),
          suggestion:
            'Consider extracting common modules into shared chunks using SplitChunksPlugin.',
        });
      }
    }

    // Small chunks that could be merged
    const smallChunks = chunks.filter(
      (c) => c.size < this.options.minChunkSize && c.isAsync
    );
    if (smallChunks.length > 3) {
      recommendations.push({
        type: 'optimization',
        category: 'chunk-merging',
        message: `Found ${smallChunks.length} small async chunks that could be merged`,
        suggestion:
          'Consider adjusting minSize in SplitChunksPlugin or merging related functionality.',
      });
    }

    return recommendations;
  }

  generateReport(analysis) {
    const outputDir = path.resolve(process.cwd(), this.options.outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportPath = path.join(outputDir, this.options.filename);

    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

    // Generate human-readable summary
    const summaryPath = path.join(outputDir, 'chunk-analysis-summary.txt');
    const summary = this.generateSummary(analysis);
    fs.writeFileSync(summaryPath, summary);

    console.log(`📊 Chunk analysis report generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Summary: ${summaryPath}`);
  }

  generateSummary(analysis) {
    const {
      chunks,
      duplicateModules,
      oversizedChunks,
      recommendations,
      performance,
    } = analysis;

    let summary = `🔍 Webpack Chunk Analysis Report\n`;
    summary += `Generated: ${analysis.timestamp}\n\n`;

    summary += `📈 Overview:\n`;
    summary += `  Total Chunks: ${analysis.totalChunks}\n`;
    summary += `  Total Size: ${analysis.totalSizeFormatted}\n`;
    summary += `  Average Chunk Size: ${this.formatBytes(analysis.averageChunkSize)}\n`;
    summary += `  Async Chunks: ${performance.asyncChunks}\n`;
    summary += `  Sync Chunks: ${performance.syncChunks}\n\n`;

    if (performance.largestChunk) {
      summary += `📏 Size Analysis:\n`;
      summary += `  Largest Chunk: ${performance.largestChunk.name} (${performance.largestChunk.sizeFormatted})\n`;
      summary += `  Smallest Chunk: ${performance.smallestChunk.name} (${performance.smallestChunk.sizeFormatted})\n\n`;
    }

    if (oversizedChunks.length > 0) {
      summary += `⚠️  Oversized Chunks (>${this.formatBytes(this.options.threshold)}):\n`;
      oversizedChunks.slice(0, 5).forEach((chunk) => {
        summary += `  - ${chunk.name}: ${chunk.sizeFormatted}\n`;
      });
      summary += `\n`;
    }

    if (duplicateModules.length > 0) {
      summary += `🔄 Top Duplicate Modules:\n`;
      duplicateModules.slice(0, 5).forEach((module) => {
        summary += `  - ${module.name}: ${this.formatBytes(module.size)} (in ${module.chunks.length} chunks)\n`;
      });
      summary += `\n`;
    }

    if (recommendations.length > 0) {
      summary += `💡 Recommendations:\n`;
      recommendations.forEach((rec, index) => {
        summary += `  ${index + 1}. [${rec.category.toUpperCase()}] ${rec.message}\n`;
        summary += `     ${rec.suggestion}\n\n`;
      });
    }

    summary += `🔗 Top 10 Largest Chunks:\n`;
    chunks.slice(0, 10).forEach((chunk, index) => {
      summary += `  ${index + 1}. ${chunk.name}: ${chunk.sizeFormatted}${chunk.isAsync ? ' (async)' : ''}\n`;
    });

    return summary;
  }

  logAnalysis(analysis) {
    console.log('\n📊 Chunk Analysis Results:');
    console.log(`Total chunks: ${analysis.totalChunks}`);
    console.log(`Total size: ${analysis.totalSizeFormatted}`);

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach((rec) => {
        console.log(`- ${rec.message}`);
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

module.exports = ChunkAnalyzerPlugin;
