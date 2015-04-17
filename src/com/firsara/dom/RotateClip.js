/*
 * RotateClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * RotateClip extends Transformable
 *
 * used for rotation calculations
 *
 * example:
 * var rotater = new RotateClip('<img src="image.jpg">');
 * rotater.borders.rotation = [-10, 10];
 * rotater.free.rotation = true; // overwrites borders
 */
define(['sys', 'EaselJS', 'dom/Transformable'], function(sys, createjs, Transformable) {

  var Parent = Transformable;

  // Event constants

  // rotate gets dispatched every frame a rotation occured
  var ROTATE = 'rotate';

  // rotateComplete gets dispatched once the element completely stopped rotating (i.e. after throwing / flying)
  var ROTATE_COMPLETE = 'rotateComplete';

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class RotateClip
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function RotateClip(template, data, options){
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

      // borders: element can not be rotated beyond set borders
      // i.e. borders.rotation = [-10, 10]  means that the element can only be rotated between -10 and 10
      _this.borders.rotation = [];

      // elastic: lets element be rotated beyond borders (value between 0 and 1 recommended)
      // i.e. elastic.rotation = 0.5  means that the element could be rotated by 0.5 the rotation after reaching borders
      _this.elastic.rotation = 0;

      // fraction.move.rotation: lets elements rotation calculations be multiplied by a defined fraction
      // i.e. fraction.move.rotation = 2  means that the element would rotate twice as fast than normally when rotating
      _this.fraction.move.rotation = 1;

      // fraction.release: lets elements throw calculation be multiplied by a defined fraction
      // i.e. fraction.release.rotation = 10  means that the element would fly a long rotation distance as if it was on ice when stopped rotating
      _this.fraction.release.rotation = 1.75;

      // fraction.speed.rotation: lets element throwing be faster than it would be (not recommended changing a lot)
      // i.e. fraction.speed.rotation = 2  means that the element would travel twice as fast when stopped rotating
      _this.fraction.speed.rotation = 1;

      // fraction.speed.max.rotation: defines a maximum duration for element throwing
      // i.e. fraction.speed.max.rotation = 1  means that the element would travel a maximum of 1 second no matter how far
      _this.fraction.speed.max.rotation = 1.3;

      // fraction.velocity.max: defines a maximum velocity that the element calculates
      // i.e. fraction.velocity.max.rotation = 0.1  means that even if the element was rotated extremely fast it behaves as if it was not
      _this.fraction.velocity.max.rotation = Number.MAX_VALUE;


      // NOTE: recognizers should not be modified too much, they should work pretty well as defined

      // rotation recognizers, used for dispatching rotation events
      _this.recognizer.rotation = 0;

      // TODO: implement turn reconigzer (turn by 180deg)

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
     * dispatches rotate event
     *
     * @method _dispatchTweenUpdate
     * @private
     **/
    var _dispatchTweenUpdate = function(){
      if (_this.lock) {
        _stopTween();
      }

      _this.dispatchEvent(ROTATE);
    };

    /**
     * dispatches rotateComplete event
     *
     * @method _dispatchComplete
     * @private
     **/
    var _dispatchComplete = function(){
      _this.dispatchEvent(ROTATE_COMPLETE);
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
     * calculates rotation based on individual changed finger positions
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

        var point1, point2, startAngle, currentAngle;

        // calculate initial angle
        point1 = points[0].old;
        point2 = points[1].old;
        startAngle = Math.atan2((point1.y - point2.y), (point1.x - point2.x)) * (180 / Math.PI);

        // calculate new angle
        point1 = points[0].current;
        point2 = points[1].current;
        currentAngle = Math.atan2((point1.y - point2.y), (point1.x - point2.x)) * (180 / Math.PI);

        // set rotation based on difference between the two angles
        _this._calc.rotation = currentAngle - startAngle;
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

        // check if tracked rotations already passed rotation recognizer
        // add calculated values to current properties
        // hold border properties while taking elasticity and fractions into account

        if (Math.abs(_this._track.current.rotation) >= _this.recognizer.rotation) {
          _this._hold('rotation', _this, true, _this._calc.rotation * _this.fraction.move.rotation * _this.fraction.base);
          _this.recognizer.fired.rotation = true;
          _this.dispatchEvent(ROTATE);
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

      // no change in rotation
      if (Math.abs(_this.velocity.delta.rotation) === 0 && ! (_this.snap || _this.snap.rotation === 0)
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
        valuePair1.rotation = _this.rotation + _this.velocity.delta.rotation * _this.fraction.release.rotation * _this.fraction.base * _this.velocity.rotation;

        // snaps properties if defined
        if (_this.snap.rotation && _this.snap.rotation !== 0) {
          valuePair1.rotation = (Math.round(valuePair1.rotation / _this.snap.rotation) * _this.snap.rotation);
        }

        // hold borders while taking elasticity into account
        _this._hold('rotation', valuePair1, true);

        options.bezier.values.push(valuePair1);


        // hold borders again without taking elasticity into account
        // TODO: check if saves performance to first check if elastic is set. otherwise valuePairs will be identical anyways
        var valuePair2 = {};
        valuePair2.rotation = valuePair1.rotation;
        _this._hold('rotation', valuePair2, false);


        var speedFraction = 1;
        var distance = 0;

        // if did not throw beyond borders
        // i.e. if the first and second value pairs for throwing out and back are identical
        if (valuePair2.rotation === valuePair1.rotation) {
          distance = Math.abs(_this.rotation - valuePair2.rotation);
        } else {
          options.bezier.values.push(valuePair2);
          distance = Math.abs(_this.rotation - valuePair1.rotation) + Math.abs(valuePair1.rotation - valuePair2.rotation);
          speedFraction = 0.75;
        }

        var speed = distance / 6 / 10 / _this.fraction.speed.move * speedFraction;
        speed = Math.min(speed, _this.fraction.speed.max.move);

        options.ease = Cubic.easeOut;
        options.onComplete = _dispatchComplete;
        options.onUpdate = _dispatchTweenUpdate;
        options.overwrite = 'auto';

        _stopTween();

        if (speed === 0) {
          _this.rotation = valuePair2.rotation;
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
