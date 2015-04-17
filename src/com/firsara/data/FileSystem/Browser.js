define([
  'sys',
  'data/FileSystem/Base'
], function(
  sys,
  Parent
) {
  var bust = 'bust=' + new Date().getTime();

  return sys.Class({
    __extends: Parent
  },
  function FileSystemBrowser(){
    var _this = this;

    Parent.call(this);

    _this.getDataBasePath = function(){
    };

    _this.getDataPath = function(){
    };

    _this.getCacheFolder = function(){
    };

    _this.purgeCache = function(callback){
    };

    _this.loadCached = function(url, callback, overwrite){
      var urlToLoad = url + (url.indexOf('?') >= 0 ? '&' : '?') + bust;

      $.get(urlToLoad, function(data){
        if (callback) {
          if (url.indexOf('.json') >= 0 && typeof data !== 'object') {
            data = JSON.parse(data.toString());
          }

          callback.call(_this, data);
        }
      });
    };

    _this.cache = function(url, callback, overwrite){
    };

    _this.download = function(url, fileName, callback, overwrite){
    };

    _this.getLocalFilePath = function(url){
    };

    _this.getLocalFiles = function(path, callback){
    };

    _this.getLocalFilesSync = function(path){
    };

  });
});
