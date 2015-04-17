define([
  'sys',
  'data/FileSystem/Base'
], function(
  sys,
  Parent
) {
  if (!!window.nodeRequire) {
    var nw = nodeRequire('nw.gui');
    var http = nodeRequire('http');
    var https = nodeRequire('https');
    var fs = nodeRequire('fs');
    var path = nodeRequire('path');
    var mkdirp = nodeRequire('mkdirp');
  }

  return sys.Class({
    __extends: Parent
  },
  function FileSystemNWJS(){
    var _this = this;

    Parent.call(this);

    _this.getDataBasePath = function(){
      return nw.App.dataPath;
    };

    _this.getDataPath = function(){
      return _this.getDataBasePath() + '/data';
    };

    _this.getCacheFolder = function(){
      return _this.getDataPath() + '/cache';
    };

    _this.purgeCache = function(callback){
      deleteFolderRecursive(_this.getCacheFolder(), callback);
    };

    _this.loadCached = function(url, callback, overwrite){
      _this.cache(url, function(localFileUrl){
        fs.readFile(localFileUrl, function(err, data){
          if (err) throw err;
          if (callback) {
            if (localFileUrl.indexOf('.json') >= 0) {
              data = JSON.parse(data.toString());
            } else {
              data = 'data:image/jpg;base64,' + data.toString('base64');
            }

            callback.call(_this, data);
          }
        });
      }, overwrite);
    };

    _this.cache = function(url, callback, overwrite){
      if (url.indexOf('https') >= 0 || url.indexOf('http') >= 0) {
        var fileId = new Buffer(url).toString('base64');
        var fileExtension = path.extname(url);
        var fileName = _this.getCacheFolder() + '/' + fileId + fileExtension;

        _this.download(url, fileName, callback, overwrite);
      } else {
        if (url.indexOf('file://') >= 0 || url.substring(0, 1) === '/') {
          if (callback) {
            callback.call(_this, url);
          }

          return url;
        } else {
          if (callback) {
            callback.call(_this, _this.getDataPath() + '/' + url);
          }

          return _this.getDataPath() + '/' + url;
        }
      }
    };

    _this.download = function(url, fileName, callback, overwrite){
      var directory = path.dirname(fileName);
      var requestMethod = null;
      if (url.indexOf('https') >= 0) requestMethod = https;
      if (url.indexOf('http') >= 0) requestMethod = http;

      if (requestMethod) {
        fs.exists(fileName, function(exists){
          if (exists && ! overwrite) {
            if (callback) {
              callback.call(_this, fileName);
            }
          } else {
            mkdirp(directory, 0744, function(){
              var file = fs.createWriteStream(fileName);

              requestMethod.get(url, function(response){
                response.pipe(file);

                file.on('finish', function() {
                  file.close(function(){
                    if (callback) {
                      callback.call(_this, fileName);
                    }
                  });
                });
              });
            });
          }
        });
      } else {
        if (fileName.indexOf('file://') >= 0 || fileName.substring(0, 1) === '/') {
          if (callback) {
            callback.call(_this, fileName);
          }
        } else {
          if (callback) {
            callback.call(_this, _this.getDataPath() + '/' + fileName);
          }
        }
      }
    };

    _this.getCachedPath = function(url, callback, overwrite){
      _this.cache(url, function(fileName){
        if (callback) {
          callback.call(_this, _this.getLocalFilePath(fileName));
        }
      }, overwrite);
    };

    _this.getLocalFilePath = function(url){
      return 'file://' + encodeURI(_this.getDataPath() + '/' + url.replace(_this.getDataPath() + '/', ''));
    };

    _this.getLocalFiles = function(path, callback){
      if (! path) path = '';

      var folderPath = _this.getDataPath() + '/' + path;

      fs.exists(folderPath, function(exists){
        if (exists) {
          fs.readdir(folderPath, function(err, files){
            if (err) {
              if (callback) {
                callback.call(_this, []);
              }
            } else {
              if (callback) {
                callback.call(_this, files);
              }
            }
          });
        } else {
          if (callback) {
            callback.call(_this, []);
          }
        }
      });
    };

    _this.getLocalFilesSync = function(path){
      if (! path) path = '';

      var folderPath = _this.getDataPath() + '/' + path;

      if (fs.existsSync(folderPath)) {
        var items = fs.readdirSync(folderPath);
        return items;
      }

      return [];
    };


    var deleteFolderRecursiveSync = function(path){
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
          var curPath = path + '/' + file;
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursiveSync(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });

        fs.rmdirSync(path);
      }
    };

    var deleteFolderRecursive = function(path, callback){
      fs.readdir(path, function(err, files) {
        if (err) {
          if (callback) {
            // Pass the error on to callback
            callback(err, []);
          }

          return;
        }

        var wait = files.length;
        var count = 0;
        var folderDone = function(err) {
          count++;

          // If we cleaned out all the files, continue
          if (count >= wait || err) {
            fs.rmdir(path, callback);
          }
        };

        // Empty directory to bail early
        if (! wait) {
          folderDone();
          return;
        }

        // Remove one or more trailing slash to keep from doubling up
        path = path.replace(/\/+$/, '');

        files.forEach(function(file) {
          var curPath = path + '/' + file;
          fs.lstat(curPath, function(err, stats) {
            if (err) {
              if (callback) {
                callback(err, []);
              }

              return;
            }

            if (stats.isDirectory()) {
              deleteFolderRecursive(curPath, folderDone);
            } else {
              fs.unlink(curPath, folderDone);
            }
          });
        });
      });
    };

  });
});
