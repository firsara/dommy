module.exports = function (grunt, options) {
  return {
    build: {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n\n/*\n<%= license %>\n*/\n\n',
        //compress: true,
        wrap: true
      },
      src: '<%= config.output %>/app.js',
      dest: '<%= config.output %>/app.js'
    },
    requirejs: {
      src: '<%= bwr.directory %>/requirejs/require.js',
      dest: '<%= config.output %>/require.js'
    }
  };
};