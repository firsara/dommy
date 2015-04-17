define([
  'config',
  'data/FileSystem/NWJS',
  'data/FileSystem/Phonegap',
  'data/FileSystem/Browser'
], function(
  config,
  FileSystemNWJS,
  FileSystemPhonegap,
  FileSystemBrowser
) {
  var classInstance = null;

  switch (config.environment) {
    case 'nwjs':
      classInstance = new FileSystemNWJS();
    break;
    case 'phonegap':
      classInstance = new FileSystemPhonegap();
    break;
    case 'browser':
      classInstance = new FileSystemBrowser();
    break;
  }

  return classInstance;
});
