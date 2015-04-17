define([
  'sys',
  'dom/Container',
  'hbs!templates/index'
], function(
  sys,
  Container,
  template
) {
  var Parent = Container;

  return sys.Class({
    __extends: Parent
  },
  function Main(){
    // reference to instance
    var _this = this;

    _this.navigation = null;
    _this.template = null;

    var _navigationData = null;

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(_this, template);

      _this.addEventListener('addedToStage', _init);
    };

    var _init = function(){
      _this.removeEventListener('addedToStage', _init);

      var TransformClip = require('dom/TransformClip');
      var transformable = new TransformClip('<div class="transformable"><img src="public/images/logo.png"></div>');
      transformable.snap.x = 10;
      transformable.snap.y = 10;
      transformable.borders.x = [50, _this.stage.width() - 50];
      transformable.borders.y = [50, _this.stage.height() - 50];
      transformable.borders.scale = [0.5, 3];
      transformable.elastic.scale = 0.5;
      transformable.free.rotation = true;
      transformable.x = _this.stage.width() / 2;
      transformable.y = _this.stage.height() / 2;
      _this.content.addChild(transformable);
    };

    Init();
  });
});
