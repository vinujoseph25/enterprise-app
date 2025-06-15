const path = require('path');

// Determine which config to use based on NODE_ENV
const mode = process.env.NODE_ENV || 'development';
const shouldAnalyze = process.env.ANALYZE === 'true';

let config;

if (shouldAnalyze) {
  config = require('./webpack.analyze.js');
} else if (mode === 'production') {
  config = require('./webpack.prod.js');
} else {
  config = require('./webpack.dev.js');
}

module.exports = config;
