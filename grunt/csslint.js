module.exports = function (grunt, options) {
  return {
    options: {
      csslintrc: '.csslintrc'
    },
    strict: {
      src: ['src/public/**/*.css']
    }
  };
};