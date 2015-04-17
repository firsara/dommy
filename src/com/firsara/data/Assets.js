/*
 * Assets extends LoadQueue
 * Stores preloaded Images
 * usage:
 * var assets = new Assets();
 * assets.load([{id: "image", src: "image/source.jpg"}]);
 * var bitmap = new createjs.Bitmap( com.firsara.data.Assets.get('image') );
 */
define(['sys', 'EaselJS'], function(sys, createjs) {

  var Parent = createjs.LoadQueue;

  return sys.Class({
    __extends: Parent
  },
  function Assets(){
    // instance
    var _this = this;

    // assets get stored here
    var _assets = {};

    var _preloadData = [];
    var _preloadImages = [];
    var _partiallyImages = 0.05;
    var _loadedFiles = 0;

    Assets.get = function(name){
      if (_assets[name]) return _assets[name];
    };

    /**
     * @constructor
     **/
    var Init = function(){
      if (Parent) Parent.call(_this);

      if (Assets.instance) throw new Error('assets can only be initialized once');
    };

    _this.load = function(data){
      _preloadData = data;

      _this.addEventListener('fileload', progress);
      _this.addEventListener('complete', complete);
      _this.loadManifest(data);
    };

    _this.get = function(name){
      return Assets.get(name);
    };

    var dispatchReady = function(){
      _this.dispatchEvent('ready');
    };

    var progress = function(event){
      _loadedFiles++;

      _assets[event.item.id] = event.rawResult;

      if (event.item.type === createjs.LoadQueue.IMAGE) {
        _preloadImages.push({name: event.item.id, src: event.result.src});
      }

      var evt = new createjs.Event('update');
      evt.percent = (_loadedFiles / _preloadData.length) * (1 - _partiallyImages);
      _this.dispatchEvent(evt);
    };

    var complete = function(){
      var _loadedFiles = -1;
      var preloadAssetsLength = _preloadImages.length;

      var loadNextImage = function(){
        _loadedFiles++;

        var event = new createjs.Event('update');
        event.percent = (1 - _partiallyImages) + (_loadedFiles / preloadAssetsLength) * _partiallyImages;
        _this.dispatchEvent(event);

        if (_preloadImages.length <= 0) {
          dispatchReady();
        } else {
          var element = _preloadImages.shift();
          _assets[element.name] = new Image();
          _assets[element.name].addEventListener('load', loadNextImage);
          _assets[element.name].src = element.src;
        }
      };

      loadNextImage();
    };


    Init();
  });
});
