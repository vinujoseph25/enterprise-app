module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['>0.2%', 'not dead', 'not op_mini all', 'not ie <= 11'],
        },
        modules: false, // Let webpack handle modules
        useBuiltIns: 'entry',
        corejs: 3,
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        development: process.env.NODE_ENV === 'development',
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-syntax-dynamic-import',

    // Tree shaking for MUI
    [
      '@babel/plugin-transform-imports',
      {
        '@mui/material': {
          transform: '@mui/material/${member}',
          preventFullImport: true,
        },
        '@mui/icons-material': {
          transform: '@mui/icons-material/${member}',
          preventFullImport: true,
        },
        '@mui/lab': {
          transform: '@mui/lab/${member}',
          preventFullImport: true,
        },
        lodash: {
          transform: 'lodash/${member}',
          preventFullImport: true,
        },
      },
    ],

    // Development only plugins
    ...(process.env.NODE_ENV === 'development' ? ['react-refresh/babel'] : []),
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    },
  },
};
