/*
 * TransformableComponent.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * TransformableComponent extends Transformable
 * mixes in MoveClip, RotateClip and ScaleClip
 *
 * a component that's not only a container but a transformable one (scaling, rotating, moving)
 * can exclude individual transformations by unsetting
 * _this._moves = false
 * _this._rotates = false
 * _this._scales = false
 * to false before calling parent constructor
 * Parent.call(_this, template, data);
 */
define([
  'sys',
  'dom/Transformable',
  'dom/MoveClip',
  'dom/RotateClip',
  'dom/ScaleClip',
  'Component'
],
function(
  sys,
  Transformable,
  MoveClip,
  RotateClip,
  ScaleClip,
  Component
) {
  var Parent = Transformable;

  var setDefaultValue = function(property, value){
    return property === null || typeof property === 'undefined' ? value : property;
  };

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class TransformableComponent
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function TransformableComponent(template, data, options){
    // instance
    var _this = this;

    // set all transformations to be default = true
    _this._moves = setDefaultValue(_this._moves, true);
    _this._rotates = setDefaultValue(_this._rotates, true);
    _this._scales = setDefaultValue(_this._scales, true);

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(_this, template, data, options);

      // mix in other classes
      if (MoveClip && _this._moves) MoveClip.call(_this);
      if (RotateClip && _this._rotates) RotateClip.call(_this);
      if (ScaleClip && _this._scales) ScaleClip.call(_this);

      // mix in component classes
      if (Component) Component.call(_this);
    };

    // initialize instance
    Init();
  });
});
