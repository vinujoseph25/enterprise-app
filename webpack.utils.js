const fs = require('fs');
const path = require('path');

// Utility functions for webpack configuration

/**
 * Get all entry points from pages directory
 */
function getEntryPoints() {
  const pagesDir = path.resolve(__dirname, 'src/pages');
  const entries = { main: './src/index.tsx' };

  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir);
    pages.forEach((page) => {
      const pagePath = path.join(pagesDir, page);
      const indexFile = path.join(pagePath, 'index.tsx');

      if (fs.existsSync(indexFile)) {
        entries[page] = `./src/pages/${page}/index.tsx`;
      }
    });
  }

  return entries;
}

/**
 * Create alias mapping from tsconfig paths
 */
function createAliasFromTsConfig() {
  const tsconfigPath = path.resolve(__dirname, 'tsconfig.json');

  if (!fs.existsSync(tsconfigPath)) {
    return {};
  }

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const { baseUrl = '.', paths = {} } = tsconfig.compilerOptions || {};

  const alias = {};

  Object.keys(paths).forEach((aliasPath) => {
    const aliasKey = aliasPath.replace('/*', '');
    const aliasValue = paths[aliasPath][0].replace('/*', '');

    alias[aliasKey] = path.resolve(__dirname, baseUrl, aliasValue);
  });

  return alias;
}

/**
 * Get environment variables starting with REACT_APP_
 */
function getClientEnvironment(nodeEnv) {
  const REACT_APP = /^REACT_APP_/i;

  const raw = Object.keys(process.env)
    .filter((key) => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        NODE_ENV: nodeEnv,
        PUBLIC_URL: process.env.PUBLIC_URL || '',
      }
    );

  // Stringify all values so they can be fed into webpack.DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

/**
 * Check if we're in development mode
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get webpack resolve configuration
 */
function getResolveConfig() {
  return {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: createAliasFromTsConfig(),
    fallback: {
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
      zlib: false,
    },
  };
}

module.exports = {
  getEntryPoints,
  createAliasFromTsConfig,
  getClientEnvironment,
  isDevelopment,
  isProduction,
  getResolveConfig,
};
