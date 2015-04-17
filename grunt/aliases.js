module.exports = function (grunt, options) {
  return {
    'default': [
      'server'
    ],
    'server': [
      'connect:server',
      'watch'
    ],
    'lint': [
      'jshint',
      'jscs',
      'csslint'
    ],
    'compile': [
      'lint',
      'clean',
      'copy',
      'requirejs',
      'cssmin',
      'uglify'
    ],
    'build:base': [
      'compile',
    ],
    'build': [
      'build:base'
    ],
    'deploy:dev': [
      'ftp-deploy:dev'
    ],
    'deploy:staging': [
      'ftp-deploy:staging'
    ],
    'deploy:production': [
      'ftp-deploy:production'
    ],
    'deploy': [
      'deploy:dev',
      'deploy:staging',
      'deploy:production'
    ],
    'release': [
      'build',
      'deploy'
    ]
  };
};