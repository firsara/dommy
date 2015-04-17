module.exports = function (grunt, options) {
  return {
    options: {
      config: '.jscsrc',
    },
    src: ['src/app/**/*.js', 'src/com/**/*.js'],
  };
};