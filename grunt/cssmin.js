module.exports = function (grunt, options) {
  return {
    options: {
      shorthandCompacting: false,
      roundingPrecision: -1
    },
    target: {
      files: {
        '<%= config.output %>/public/assets/stylesheets/screen.min.css': [
          'src/public/assets/stylesheets/fonts.css',
          'src/public/assets/stylesheets/icons.css',
          'src/public/assets/stylesheets/screen.css'
        ]
      }
    }
  };
};