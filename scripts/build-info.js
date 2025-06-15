#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildInfo = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  gitCommit:
    process.env.GITHUB_SHA ||
    execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
  gitBranch:
    process.env.GITHUB_REF_NAME ||
    execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
  environment: process.env.REACT_APP_ENV || 'development',
  nodeVersion: process.version,
};

const buildInfoPath = path.join(process.cwd(), 'public', 'build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log('✅ Build info generated:', buildInfoPath);
console.log(JSON.stringify(buildInfo, null, 2));
