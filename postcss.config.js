module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        '>0.2%',
        'not dead',
        'not op_mini all',
        'not ie <= 11',
      ],
    }),
  ],
};
