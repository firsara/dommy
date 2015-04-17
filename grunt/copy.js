module.exports = function (grunt, options) {
  return {
    build: {
      files: [
        {
          expand: false,
          src: ['src/dist.html'],
          dest: '<%= config.output %>/index.html',
          filter: 'isFile'
        },
        {
          expand: true,
          src: ['**/*', '!**/*.scss', '!**/sass/**'],
          dest: 'dist/public',
          cwd: 'src/public'
        }
      ]
    }
  };
};