module.exports = function (grunt, options) {
  return {
    scripts: {
      files: ['src/**/*.js'],
      tasks: ['jshint', 'jscs'],
      options: {
        spawn: false,
      },
    },
    css: {
      files: ['src/public/**/*.css'],
      tasks: ['csslint'],
      options: {
        spawn: false,
      },
    },
  };
};