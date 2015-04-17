define([
  'sys'
], function(
  sys
) {
  return sys.Class({}, function FileSystemBase(){
    var _this = this;

    _this.getDataBasePath = function(){
    };

    _this.getDataPath = function(){
    };

    _this.getCacheFolder = function(){
    };

    _this.purgeCache = function(callback){
    };

    _this.loadCached = function(url, callback, overwrite){
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
