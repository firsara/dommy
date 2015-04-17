module.exports = function (grunt, options) {
  return {
    options: {
      jshintrc: true,
    },
    src: ['src/app/**/*.js', 'src/com/**/*.js'],
  };
};