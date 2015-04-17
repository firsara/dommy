/*
 * TransformClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * TransformClip extends Transformable
 * mixes in MoveClip, RotateClip and ScaleClip
 *
 * used for transformation calculations
 *
 * example:
 * var transformer = new TransformClip('<img src="image.jpg">');
 * transformer.borders.scale = [0.1, 2];
 * transformer.borders.rotation = [-10, 10];
 * transformer.borders.x = [-100, 100];
 * transformer.borders.y = [-100, 100];
 */
define([
  'sys',
  'dom/Transformable',
  'dom/MoveClip',
  'dom/RotateClip',
  'dom/ScaleClip'
],
function(
  sys,
  Transformable,
  MoveClip,
  RotateClip,
  ScaleClip
) {
  var Parent = Transformable;

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class TransformClip
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function TransformClip(template, data, options){
    // instance
    var _this = this;

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(_this, template, data, options);

      // mix in other classes
      if (MoveClip) MoveClip.call(_this);
      if (RotateClip) RotateClip.call(_this);
      if (ScaleClip) ScaleClip.call(_this);
    };

    // initialize instance
    Init();
  });
});
