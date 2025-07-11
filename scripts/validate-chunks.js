#!/usr/bin/env node

/**
 * Chunk Validation Script
 * Validates chunk integrity, structure, and adherence to best practices
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');

class ChunkValidator {
  constructor() {
    this.buildDir = path.join(process.cwd(), 'build');
    this.staticDir = path.join(this.buildDir, 'static');
    this.jsDir = path.join(this.staticDir, 'js');
    this.validationResults = {
      timestamp: new Date().toISOString(),
      chunks: [],
      issues: [],
      warnings: [],
      summary: {
        totalChunks: 0,
        validChunks: 0,
        issues: 0,
        warnings: 0,
        score: 0,
      },
    };
    this.rules = this.loadValidationRules();
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      progress: chalk.cyan,
    };
    console.log(colors[type](`🔍 ${message}`));
  }

  loadValidationRules() {
    return {
      maxChunkSize: 1024 * 1024, // 1MB
      maxMainChunkSize: 512 * 1024, // 512KB
      maxVendorChunkSize: 2 * 1024 * 1024, // 2MB
      minChunkSize: 10 * 1024, // 10KB
      maxTotalChunks: 20,
      minAsyncChunks: 1,
      requiredChunkTypes: ['main'],
      allowedFileExtensions: ['.js', '.css'],
      naming: {
        requireContentHash: true,
        hashLength: 8,
      },
      compression: {
        requireGzip: true,
        requireBrotli: false,
        minCompressionRatio: 30,
      },
      sourceMaps: {
        allowInProduction: false,
        requireInDevelopment: true,
      },
    };
  }

  async validate() {
    this.log('Starting chunk validation...', 'info');

    try {
      if (!fs.existsSync(this.buildDir)) {
        this.addIssue(
          'critical',
          'Build directory not found. Please run build first.'
        );
        this.displayResults();
        process.exit(1);
      }

      await this.discoverChunks();
      await this.validateChunkStructure();
      await this.validateChunkSizes();
      await this.validateChunkNaming();
      await this.validateChunkTypes();
      await this.validateCompression();
      await this.validateSourceMaps();
      await this.validateIntegrity();
      await this.validateDependencies();
      await this.calculateScore();
      await this.saveResults();

      this.displayResults();
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async discoverChunks() {
    this.log('Discovering chunks...', 'progress');

    if (!fs.existsSync(this.jsDir)) {
      this.addIssue(
        'critical',
        'No JavaScript directory found in build output'
      );
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
          type: this.identifyChunkType(file),
          hasSourceMap: fs.existsSync(filePath + '.map'),
          hasGzip: fs.existsSync(filePath + '.gz'),
          hasBrotli: fs.existsSync(filePath + '.br'),
          contentHash: this.extractContentHash(file),
          valid: true,
          issues: [],
          warnings: [],
        };
      });

    this.validationResults.chunks = jsFiles;
    this.validationResults.summary.totalChunks = jsFiles.length;
  }

  identifyChunkType(filename) {
    if (filename.includes('main') || filename.includes('index')) return 'main';
    if (filename.includes('vendor') || filename.includes('node_modules'))
      return 'vendor';
    if (filename.includes('runtime') || filename.includes('webpack'))
      return 'runtime';
    if (filename.match(/^\d+\./) || filename.includes('chunk')) return 'async';
    if (filename.includes('polyfill')) return 'polyfill';
    return 'unknown';
  }

  extractContentHash(filename) {
    const match = filename.match(/\.([a-f0-9]{8,})\./);
    return match ? match[1] : null;
  }

  async validateChunkStructure() {
    this.log('Validating chunk structure...', 'progress');

    const chunkTypes = this.validationResults.chunks.reduce((acc, chunk) => {
      acc[chunk.type] = (acc[chunk.type] || 0) + 1;
      return acc;
    }, {});

    // Check for required chunk types
    this.rules.requiredChunkTypes.forEach((requiredType) => {
      if (!chunkTypes[requiredType]) {
        this.addIssue('high', `Missing required chunk type: ${requiredType}`);
      }
    });

    // Check chunk count limits
    if (
      this.validationResults.summary.totalChunks > this.rules.maxTotalChunks
    ) {
      this.addWarning(
        'medium',
        `Too many chunks (${this.validationResults.summary.totalChunks}). Consider consolidation.`
      );
    }

    if (
      this.validationResults.summary.totalChunks <
      this.rules.minAsyncChunks + 1
    ) {
      this.addWarning(
        'medium',
        'Very few chunks detected. Consider implementing code splitting.'
      );
    }

    // Check for multiple main chunks
    if (chunkTypes.main > 1) {
      this.addIssue(
        'medium',
        `Multiple main chunks detected (${chunkTypes.main}). This may cause loading issues.`
      );
    }

    // Check for unknown chunk types
    if (chunkTypes.unknown > 0) {
      this.addWarning(
        'low',
        `${chunkTypes.unknown} chunks with unknown types detected.`
      );
    }
  }

  async validateChunkSizes() {
    this.log('Validating chunk sizes...', 'progress');

    this.validationResults.chunks.forEach((chunk) => {
      // General size validation
      if (chunk.size > this.rules.maxChunkSize) {
        this.addChunkIssue(
          chunk,
          'high',
          `Chunk exceeds maximum size limit (${this.formatBytes(chunk.size)})`
        );
      }

      if (chunk.size < this.rules.minChunkSize) {
        this.addChunkWarning(
          chunk,
          'low',
          `Chunk is very small (${this.formatBytes(chunk.size)}). Consider bundling.`
        );
      }

      // Type-specific size validation
      if (chunk.type === 'main' && chunk.size > this.rules.maxMainChunkSize) {
        this.addChunkIssue(
          chunk,
          'high',
          `Main chunk is too large (${this.formatBytes(chunk.size)})`
        );
      }

      if (
        chunk.type === 'vendor' &&
        chunk.size > this.rules.maxVendorChunkSize
      ) {
        this.addChunkWarning(
          chunk,
          'medium',
          `Vendor chunk is very large (${this.formatBytes(chunk.size)})`
        );
      }
    });
  }

  async validateChunkNaming() {
    this.log('Validating chunk naming conventions...', 'progress');

    this.validationResults.chunks.forEach((chunk) => {
      // Content hash validation
      if (this.rules.naming.requireContentHash) {
        if (!chunk.contentHash) {
          this.addChunkIssue(
            chunk,
            'medium',
            'Chunk missing content hash for cache busting'
          );
        } else if (chunk.contentHash.length < this.rules.naming.hashLength) {
          this.addChunkWarning(
            chunk,
            'low',
            `Content hash is short (${chunk.contentHash.length} chars)`
          );
        }
      }

      // File extension validation
      const ext = path.extname(chunk.name);
      if (!this.rules.allowedFileExtensions.includes(ext)) {
        this.addChunkIssue(chunk, 'medium', `Invalid file extension: ${ext}`);
      }

      // Naming convention validation
      if (chunk.name.includes(' ') || chunk.name.includes('_')) {
        this.addChunkWarning(
          chunk,
          'low',
          'Chunk name contains spaces or underscores'
        );
      }
    });
  }

  async validateChunkTypes() {
    this.log('Validating chunk type distribution...', 'progress');

    const typeDistribution = this.validationResults.chunks.reduce(
      (acc, chunk) => {
        acc[chunk.type] = (acc[chunk.type] || []).concat(chunk);
        return acc;
      },
      {}
    );

    // Validate main chunks
    if (typeDistribution.main && typeDistribution.main.length > 1) {
      this.addIssue(
        'high',
        'Multiple main chunks detected - this can cause loading conflicts'
      );
    }

    // Validate vendor separation
    if (!typeDistribution.vendor) {
      this.addWarning(
        'medium',
        'No vendor chunks detected - consider separating vendor libraries'
      );
    }

    // Validate async chunks
    if (!typeDistribution.async || typeDistribution.async.length === 0) {
      this.addWarning(
        'medium',
        'No async chunks detected - consider implementing code splitting'
      );
    }

    // Check for runtime chunk
    if (!typeDistribution.runtime) {
      this.addWarning(
        'low',
        'No runtime chunk detected - this may affect caching efficiency'
      );
    }
  }

  async validateCompression() {
    this.log('Validating compression settings...', 'progress');

    this.validationResults.chunks.forEach((chunk) => {
      if (this.rules.compression.requireGzip && !chunk.hasGzip) {
        this.addChunkWarning(chunk, 'medium', 'Missing gzip compression');
      }

      if (this.rules.compression.requireBrotli && !chunk.hasBrotli) {
        this.addChunkWarning(chunk, 'low', 'Missing brotli compression');
      }

      // Check compression ratios
      if (chunk.hasGzip) {
        try {
          const gzipPath = chunk.path + '.gz';
          const gzipSize = fs.statSync(gzipPath).size;
          const compressionRatio = ((chunk.size - gzipSize) / chunk.size) * 100;

          if (compressionRatio < this.rules.compression.minCompressionRatio) {
            this.addChunkWarning(
              chunk,
              'low',
              `Poor gzip compression ratio (${compressionRatio.toFixed(1)}%)`
            );
          }
        } catch (error) {
          this.addChunkWarning(
            chunk,
            'low',
            'Gzip file exists but cannot be read'
          );
        }
      }
    });
  }

  async validateSourceMaps() {
    this.log('Validating source map configuration...', 'progress');

    const isProduction = process.env.NODE_ENV === 'production';

    this.validationResults.chunks.forEach((chunk) => {
      if (
        isProduction &&
        this.rules.sourceMaps.allowInProduction === false &&
        chunk.hasSourceMap
      ) {
        this.addChunkWarning(
          chunk,
          'medium',
          'Source map present in production build - consider removing for security'
        );
      }

      if (
        !isProduction &&
        this.rules.sourceMaps.requireInDevelopment &&
        !chunk.hasSourceMap
      ) {
        this.addChunkWarning(
          chunk,
          'low',
          'Source map missing in development build'
        );
      }
    });
  }

  async validateIntegrity() {
    this.log('Validating chunk integrity...', 'progress');

    for (const chunk of this.validationResults.chunks) {
      try {
        // Check if file is readable
        const content = fs.readFileSync(chunk.path, 'utf8');

        // Basic syntax validation
        if (content.length === 0) {
          this.addChunkIssue(chunk, 'high', 'Chunk file is empty');
          continue;
        }

        // Check for webpack chunk format
        if (
          !content.includes('webpackChunk') &&
          !content.includes('webpackJsonp') &&
          chunk.type !== 'runtime'
        ) {
          this.addChunkWarning(
            chunk,
            'medium',
            'Chunk does not appear to be a valid webpack chunk'
          );
        }

        // Calculate and store content hash for integrity
        const hash = crypto.createHash('md5').update(content).digest('hex');
        chunk.calculatedHash = hash.substring(0, 8);

        // Compare with filename hash if present
        if (chunk.contentHash && chunk.contentHash !== chunk.calculatedHash) {
          this.addChunkWarning(
            chunk,
            'medium',
            'Content hash in filename does not match actual content'
          );
        }
      } catch (error) {
        this.addChunkIssue(
          chunk,
          'high',
          `Cannot read chunk file: ${error.message}`
        );
      }
    }
  }

  async validateDependencies() {
    this.log('Validating chunk dependencies...', 'progress');

    // Check for circular dependencies or missing chunks
    // This is a simplified check - a full dependency analysis would require parsing webpack manifests

    const manifestPath = path.join(this.buildDir, 'asset-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Validate that all files in manifest exist
        Object.values(manifest.files || {}).forEach((filePath) => {
          if (filePath.endsWith('.js')) {
            const fullPath = path.join(
              this.buildDir,
              filePath.replace(/^\//, '')
            );
            if (!fs.existsSync(fullPath)) {
              this.addIssue(
                'high',
                `Manifest references missing file: ${filePath}`
              );
            }
          }
        });

        // Check for entrypoints
        if (manifest.entrypoints && manifest.entrypoints.length === 0) {
          this.addIssue('high', 'No entrypoints defined in manifest');
        }
      } catch (error) {
        this.addWarning(
          'medium',
          `Cannot parse asset manifest: ${error.message}`
        );
      }
    } else {
      this.addWarning(
        'medium',
        'Asset manifest not found - cannot validate dependencies'
      );
    }

    // Check for orphaned chunks (chunks not referenced by any other chunk)
    this.validateOrphanedChunks();
  }

  validateOrphanedChunks() {
    const asyncChunks = this.validationResults.chunks.filter(
      (chunk) => chunk.type === 'async'
    );

    if (asyncChunks.length > 0) {
      // Simple check: if we have async chunks but no dynamic imports in main chunk
      const mainChunk = this.validationResults.chunks.find(
        (chunk) => chunk.type === 'main'
      );

      if (mainChunk) {
        try {
          const mainContent = fs.readFileSync(mainChunk.path, 'utf8');
          const hasDynamicImports =
            mainContent.includes('import(') ||
            mainContent.includes('__webpack_require__.e') ||
            mainContent.includes('webpackChunkName');

          if (!hasDynamicImports && asyncChunks.length > 0) {
            this.addWarning(
              'medium',
              'Async chunks detected but no dynamic imports found in main chunk'
            );
          }
        } catch (error) {
          // Cannot read main chunk content
        }
      }
    }
  }

  async calculateScore() {
    this.log('Calculating validation score...', 'progress');

    let score = 100;
    let validChunks = 0;

    // Deduct points for issues
    this.validationResults.issues.forEach((issue) => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for warnings (less severe)
    this.validationResults.warnings.forEach((warning) => {
      switch (warning.severity) {
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 3;
          break;
        case 'low':
          score -= 1;
          break;
      }
    });

    // Count valid chunks (chunks without critical issues)
    this.validationResults.chunks.forEach((chunk) => {
      const hasCriticalIssues = chunk.issues.some(
        (issue) => issue.severity === 'critical' || issue.severity === 'high'
      );

      if (!hasCriticalIssues) {
        validChunks++;
        chunk.valid = true;
      } else {
        chunk.valid = false;
      }
    });

    this.validationResults.summary = {
      totalChunks: this.validationResults.chunks.length,
      validChunks,
      issues: this.validationResults.issues.length,
      warnings: this.validationResults.warnings.length,
      score: Math.max(0, Math.min(100, score)),
    };
  }

  addIssue(severity, message, chunk = null) {
    const issue = {
      severity,
      message,
      chunk: chunk ? chunk.name : null,
      timestamp: new Date().toISOString(),
    };

    this.validationResults.issues.push(issue);

    if (chunk) {
      chunk.issues = chunk.issues || [];
      chunk.issues.push(issue);
    }
  }

  addWarning(severity, message, chunk = null) {
    const warning = {
      severity,
      message,
      chunk: chunk ? chunk.name : null,
      timestamp: new Date().toISOString(),
    };

    this.validationResults.warnings.push(warning);

    if (chunk) {
      chunk.warnings = chunk.warnings || [];
      chunk.warnings.push(warning);
    }
  }

  addChunkIssue(chunk, severity, message) {
    this.addIssue(severity, message, chunk);
  }

  addChunkWarning(chunk, severity, message) {
    this.addWarning(severity, message, chunk);
  }

  async saveResults() {
    const reportPath = path.join(process.cwd(), 'chunk-validation-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(this.validationResults, null, 2)
    );
    this.log(`Validation report saved to ${reportPath}`, 'success');
  }

  displayResults() {
    console.log('\n' + chalk.cyan('🔍 Chunk Validation Results'));
    console.log(chalk.cyan('='.repeat(50)));

    const { summary } = this.validationResults;

    // Overall score with color coding
    const scoreColor =
      summary.score >= 80
        ? chalk.green
        : summary.score >= 60
          ? chalk.yellow
          : chalk.red;

    console.log(`📊 Overall Score: ${scoreColor(summary.score + '/100')}`);
    console.log(`📦 Total Chunks: ${chalk.yellow(summary.totalChunks)}`);
    console.log(`✅ Valid Chunks: ${chalk.green(summary.validChunks)}`);
    console.log(`❌ Issues Found: ${chalk.red(summary.issues)}`);
    console.log(`⚠️  Warnings: ${chalk.yellow(summary.warnings)}`);

    // Chunk breakdown by type
    console.log('\n' + chalk.cyan('📈 Chunk Distribution:'));
    const typeDistribution = this.validationResults.chunks.reduce(
      (acc, chunk) => {
        acc[chunk.type] = (acc[chunk.type] || 0) + 1;
        return acc;
      },
      {}
    );

    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`${type}: ${chalk.yellow(count)}`);
    });

    // Display top issues
    if (this.validationResults.issues.length > 0) {
      console.log('\n' + chalk.cyan('🚨 Critical Issues:'));
      const criticalIssues = this.validationResults.issues
        .filter(
          (issue) => issue.severity === 'critical' || issue.severity === 'high'
        )
        .slice(0, 5);

      criticalIssues.forEach((issue) => {
        const severityColor =
          issue.severity === 'critical' ? chalk.red : chalk.yellow;
        const chunkInfo = issue.chunk ? ` [${issue.chunk}]` : '';
        console.log(`${severityColor('●')} ${issue.message}${chunkInfo}`);
      });

      if (this.validationResults.issues.length > 5) {
        console.log(
          chalk.gray(
            `... and ${this.validationResults.issues.length - 5} more issues`
          )
        );
      }
    }

    // Display warnings if no critical issues
    if (
      this.validationResults.issues.length === 0 &&
      this.validationResults.warnings.length > 0
    ) {
      console.log('\n' + chalk.cyan('⚠️  Warnings:'));
      const topWarnings = this.validationResults.warnings.slice(0, 5);

      topWarnings.forEach((warning) => {
        const chunkInfo = warning.chunk ? ` [${warning.chunk}]` : '';
        console.log(`${chalk.yellow('●')} ${warning.message}${chunkInfo}`);
      });

      if (this.validationResults.warnings.length > 5) {
        console.log(
          chalk.gray(
            `... and ${this.validationResults.warnings.length - 5} more warnings`
          )
        );
      }
    }

    // Individual chunk status
    console.log('\n' + chalk.cyan('📋 Individual Chunk Status:'));
    this.validationResults.chunks.forEach((chunk) => {
      const statusIcon = chunk.valid ? '✅' : '❌';
      const sizeInfo = `(${this.formatBytes(chunk.size)})`;
      const typeInfo = `[${chunk.type}]`;

      console.log(`${statusIcon} ${chunk.name} ${typeInfo} ${sizeInfo}`);

      // Show chunk-specific issues
      if (chunk.issues && chunk.issues.length > 0) {
        chunk.issues.slice(0, 2).forEach((issue) => {
          console.log(`   ${chalk.red('▸')} ${issue.message}`);
        });
      }
    });

    // Recommendations based on validation results
    this.displayRecommendations();

    console.log('\n' + chalk.green('✅ Chunk validation complete!'));
    console.log(
      chalk.blue('💡 Check chunk-validation-report.json for detailed results')
    );

    // Exit with error code if there are critical issues
    if (
      summary.score < 60 ||
      this.validationResults.issues.some(
        (issue) => issue.severity === 'critical'
      )
    ) {
      console.log(
        chalk.red('\n❌ Validation failed - critical issues detected')
      );
      process.exit(1);
    }
  }

  displayRecommendations() {
    const recommendations = [];

    // Generate recommendations based on validation results
    if (this.validationResults.summary.score < 80) {
      recommendations.push(
        'Review and fix critical issues to improve chunk quality'
      );
    }

    const largeChunks = this.validationResults.chunks.filter(
      (chunk) => chunk.size > this.rules.maxChunkSize
    );
    if (largeChunks.length > 0) {
      recommendations.push('Implement code splitting for large chunks');
    }

    const noVendorChunk = !this.validationResults.chunks.some(
      (chunk) => chunk.type === 'vendor'
    );
    if (noVendorChunk) {
      recommendations.push(
        'Consider separating vendor libraries into dedicated chunks'
      );
    }

    const noAsyncChunks = !this.validationResults.chunks.some(
      (chunk) => chunk.type === 'async'
    );
    if (noAsyncChunks) {
      recommendations.push(
        'Implement route-based or component-based code splitting'
      );
    }

    const missingCompression = this.validationResults.chunks.some(
      (chunk) => !chunk.hasGzip
    );
    if (missingCompression) {
      recommendations.push('Enable gzip compression for better performance');
    }

    const missingContentHash = this.validationResults.chunks.some(
      (chunk) => !chunk.contentHash
    );
    if (missingContentHash) {
      recommendations.push(
        'Add content hashes to chunk names for better caching'
      );
    }

    if (recommendations.length > 0) {
      console.log('\n' + chalk.cyan('💡 Recommendations:'));
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ChunkValidator();
  validator.validate().catch((error) => {
    console.error(chalk.red('❌ Validation failed:'), error);
    process.exit(1);
  });
}

module.exports = ChunkValidator;
