module.exports = function (grunt, options) {
  return {
    compile: {
      options: {
        baseUrl: 'src/app',
        out: '<%= config.output %>/app.js',
        name: 'app',
        include: ['app'],
        exclude: [],
        optimize: 'none',
        wrap: true,
        findNestedDependencies: true,
        fileExclusionRegExp: /^\./,
        inlineText: true,
        logLevel: 0,
        mainConfigFile: [
          './src/require.config.js',
          './src/require.packages.js',
          './src/com/firsara/config.js',
          './src/app.js'
        ]
      }
    }
  };
};