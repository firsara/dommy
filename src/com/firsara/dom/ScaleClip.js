/*
 * ScaleClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * ScaleClip extends Transformable
 *
 * used for scaling calculations
 *
 * example:
 * var scaler = new ScaleClip('<img src="image.jpg">');
 * scaler.borders.scale = [0.1, 2];
 * scaler.free.scale = true; // overwrites borders
 */
define(['sys', 'EaselJS', 'dom/Transformable'], function(sys, createjs, Transformable) {

  var Parent = Transformable;

  // Event constants

  // scale gets dispatched every frame a scale occured
  var SCALE = 'scale';

  // scaleComplete gets dispatched once the element completely stopped scaling (i.e. after throwing / flying)
  var SCALE_COMPLETE = 'scaleComplete';

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class ScaleClip
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function ScaleClip(template, data, options){
    // instance
    var _this = this;

    // stored fade-out-tween
    var _tween = null;

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor, only if instance is not a mixin of another class
      if (Parent && ! _this._initialized) Parent.call(_this, template, data, options);

      // borders: element can not be scaled beyond set borders
      // i.e. borders.scale = [-10, 10]  means that the element can only be scaled between -10 and 10
      _this.borders.scale = [];

      // elastic: lets element be scaled beyond borders (value between 0 and 1 recommended)
      // i.e. elastic.scale = 0.5  means that the element could be scaled by 0.5 the scale after reaching borders
      _this.elastic.scale = 0;

      // fraction.move.scale: lets elements scale calculations be multiplied by a defined fraction
      // i.e. fraction.move.scale = 2  means that the element would scale twice as fast than normally when scaling
      _this.fraction.move.scale = 1;

      // fraction.release: lets elements throw calculation be multiplied by a defined fraction
      // i.e. fraction.release.scale = 10  means that the element would fly a long scale distance as if it was on ice when stopped scaling
      _this.fraction.release.scale = 2;

      // fraction.speed.scale: lets element throwing be faster than it would be (not recommended changing a lot)
      // i.e. fraction.speed.scale = 2  means that the element would travel twice as fast when stopped scaling
      _this.fraction.speed.scale = 1;

      // fraction.speed.max.scale: defines a maximum duration for element throwing
      // i.e. fraction.speed.max.scale = 1  means that the element would travel a maximum of 1 second no matter how far
      _this.fraction.speed.max.scale = 1.3;

      // fraction.velocity.max: defines a maximum velocity that the element calculates
      // i.e. fraction.velocity.max.scale = 0.1  means that even if the element was scaled extremely fast it behaves as if it was not
      _this.fraction.velocity.max.scale = Number.MAX_VALUE;


      // NOTE: recognizers should not be modified too much, they should work pretty well as defined

      // scale recognizers, used for dispatching scale events
      _this.recognizer.scale = 0;

      _this.addEventListener('start', _startTransform);
      _this.addEventListener('calc', _calc);
      _this.addEventListener('update', _update);
      _this.addEventListener('complete', _stopTransform);
    };

    /**
     * kills a tween used for property throwing (i.e. "flying" element)
     *
     * @method _stopTween
     * @private
     **/
    var _stopTween = function(){
      if (_tween) {
        _tween.kill();
        _tween = null;
      }
    };

    /**
     * dispatches scale event
     *
     * @method _dispatchTweenUpdate
     * @private
     **/
    var _dispatchTweenUpdate = function(){
      if (_this.lock) {
        _stopTween();
      }

      _this.dispatchEvent(SCALE);
    };

    /**
     * dispatches scaleComplete event
     *
     * @method _dispatchComplete
     * @private
     **/
    var _dispatchComplete = function(){
      _this.dispatchEvent(SCALE_COMPLETE);
    };

    /**
     * stops previous tween if detected more than one finger
     *
     * @method _startTransform
     * @private
     **/
    var _startTransform = function(event){
      if (_this._activeFingers > 1) {
        _stopTween();
      }
    };

    /**
     * calculates distance between two points
     *
     * @method _getDistance
     * @private
     **/
    var _getDistance = function(p1, p2) {
      var x = p2.x - p1.x;
      var y = p2.y - p1.y;

      return Math.sqrt((x * x) + (y * y));
    };

    /**
     * calculates scale based on individual changed finger positions
     * for current frame only. Only calculates. Does not set properties on element
     *
     * @method _calc
     * @private
     **/
    var _calc = function(event){
      // NOTE: TODO: remove _this.lock check for only dispatching events?
      if (_this.lock) return;

      if (_this._activeFingers > 1) {
        var points = [];

        // extract touchpoints
        for (var k in _this._fingers) {
          if (_this._fingers[k].current) {
            points.push(_this._fingers[k]);

            // only use first two fingers
            if (points.length >= 2) break;
          }
        }

        var scale = _getDistance(points[0].current, points[1].current) / _getDistance(points[0].old, points[1].old);

        _this._calc.scale = (scale - 1);
      }
    };

    /**
     * Sets calculated properties on element.
     * called only every frame, not on a mousemove or touchmove event.
     * only called when finger positions changed to save performance.
     *
     * @method _update
     * @private
     **/
    var _update = function(event){
      if (_this.lock) return;

      if (_this._activeFingers > 1) {

        // check if tracked scales already passed scale recognizer
        // add calculated values to current properties
        // hold border properties while taking elasticity and fractions into account

        if (Math.abs(_this._track.current.scale) >= _this.recognizer.scale) {
          _this._hold('scale', _this, true, _this._calc.scale * _this.fraction.move.scale * _this.fraction.base);
          _this.recognizer.fired.scale = true;
          _this.dispatchEvent(SCALE);
        }
      }
    };

    /**
     * Calculates throwing properties based on current velocity
     * initializes TweenLite animation if needed
     * snaps properties if set
     *
     * @method _stopTransform
     * @private
     **/
    var _stopTransform = function(){
      if (_this.lock) return;

      // no change in scaling
      if (Math.abs(_this.velocity.delta.scale) === 0 && ! (_this.snap || _this.snap.scale === 0)
      ) {
        // NOTE: TODO: can cause problems if something was dragged outside elastic bounds and touched directly afterwards
        // CHECK if Problems appear!
        _dispatchComplete();
      } else {
        var options = {};
        options.bezier = {};
        options.bezier.curviness = 0;
        options.bezier.values = [];

        // calculate throwing properties based on velocity and fractions
        var valuePair1 = {};
        valuePair1.scaleX = _this.scaleX + _this.velocity.delta.scale * _this.fraction.release.scale * _this.fraction.base * _this.velocity.scale;

        // snaps properties if defined
        if (_this.snap.scale && _this.snap.scale !== 0) {
          valuePair1.scaleX = (Math.round(valuePair1.scaleX / _this.snap.scale) * _this.snap.scale);
        }

        valuePair1.scaleY = valuePair1.scaleX;

        // hold borders while taking elasticity into account
        _this._hold('scale', valuePair1, true);

        options.bezier.values.push(valuePair1);


        // hold borders again without taking elasticity into account
        // TODO: check if saves performance to first check if elastic is set. otherwise valuePairs will be identical anyways
        var valuePair2 = {};
        valuePair2.scaleX = valuePair1.scaleX;
        valuePair2.scaleY = valuePair1.scaleY;
        _this._hold('scale', valuePair2, false);


        var speedFraction = 1;
        var distance = 0;

        // if did not throw beyond borders
        // i.e. if the first and second value pairs for throwing out and back are identical
        if (valuePair2.scaleX === valuePair1.scaleX) {
          distance = Math.abs(_this.scaleX - valuePair2.scaleX);
        } else {
          options.bezier.values.push(valuePair2);
          distance = Math.abs(_this.scaleX - valuePair1.scaleX) + Math.abs(valuePair1.scaleX - valuePair2.scaleX);
          speedFraction = 0.75;
        }

        var speed = distance / 6 / 0.05 / _this.fraction.speed.scale * speedFraction;
        speed = Math.min(speed, _this.fraction.speed.max.scale);

        options.ease = Cubic.easeOut;
        options.onComplete = _dispatchComplete;
        options.onUpdate = _dispatchTweenUpdate;
        options.overwrite = 'auto';

        _stopTween();

        if (speed === 0) {
          _this.scaleX = valuePair2.scaleX;
          _this.scaleY = valuePair2.scaleY;
          _dispatchComplete();
        } else {
          _tween = TweenLite.to(_this, speed, options);
        }
      }
    };

    // initialize instance
    Init();
  });
});
