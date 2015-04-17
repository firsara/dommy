/*
 * MoveClip.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * MoveClip extends Transformable
 *
 * used for move calculations, swipe detections etc.
 *
 * example:
 * var mover = new MoveClip('<img src="image.jpg">');
 * mover.borders.x = [-10, 10];
 * mover.scrolls('y');
 * mover.free.x = true; // overwrites borders
 */
define(['sys', 'EaselJS', 'dom/Transformable'], function(sys, createjs, Transformable) {

  var Parent = Transformable;

  // Event constants

  // move gets dispatched every frame a movement occured
  var MOVE = 'move';

  // moveComplete gets dispatched once the element completely stopped moving (i.e. after throwing / flying)
  var MOVE_COMPLETE = 'moveComplete';

  // swipe gets dispatched once a swipe was detected. see recognizer for settings
  var SWIPE = 'swipe';

  // properties used for simplifying swipe checks
  var SWIPE_PROPERTIES = {
    horizontal: {axis: 'x', size: 'width', prev: 'left', next: 'right'},
    vertical: {axis: 'y', size: 'height', prev: 'up', next: 'down'},
    directions: {left: -1, right: 1, up: -1, down: -1}
  };

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class MoveClip
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function MoveClip(template, data, options){
    // reference to instance
    var _this = this;

    // layer active moveclip to the top of the index list
    _this.level = false;

    // stored fade-out-tween
    var _tween = null;

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor, only if instance is not a mixin of another class
      if (Parent && ! _this._initialized) Parent.call(_this, template, data, options);

      // borders: element can not be moved beyond set borders
      // i.e. borders.x = [-10, 10]  means that the element can only be moved between x = -10 and x = 10
      _this.borders.x = [];
      _this.borders.y = [];

      // elastic: lets element be moved beyond borders (value between 0 and 1 recommended)
      // i.e. elastic.x = 0.5  means that the element could be moved by 0.5 the movement after reaching borders
      // mainly used for scrollable containers (see iOS scroll behaviour)
      _this.elastic.x = 0;
      _this.elastic.y = 0;

      // fraction.move: lets elements move calculations be multiplied by a defined fraction
      // i.e. fraction.move.x = 2  means that the element would move twice as fast than normally when dragging
      _this.fraction.move.x = 1;
      _this.fraction.move.y = 1;

      // fraction.release: lets elements throw calculation be multiplied by a defined fraction
      // i.e. fraction.release.x = 10  means that the element would fly a long distance as if it was on ice when stopped dragging
      _this.fraction.release.x = 1;
      _this.fraction.release.y = 1;

      // fraction.speed.move: lets element throwing be faster than it would be (not recommended changing a lot)
      // i.e. fraction.speed.move = 2  means that the element would travel twice as fast when stopped dragging
      _this.fraction.speed.move = 1;

      // fraction.speed.max.move: defines a maximum duration for element throwing
      // i.e. fraction.speed.max.move = 1  means that the element would travel a maximum of 1 second no matter how far
      _this.fraction.speed.max.move = 2;

      // fraction.velocity.max: defines a maximum velocity that the element calculates
      // i.e. fraction.velocity.max.x = 0.1  means that even if the element was dragged extremely fast it behaves as if it was not
      _this.fraction.velocity.max.x = Number.MAX_VALUE;
      _this.fraction.velocity.max.y = Number.MAX_VALUE;


      // NOTE: recognizers should not be modified too much, they should work pretty well as defined
      // use helper functions instead (like _this.scrolls('y'))

      // move recognizers, used for dispatching move events
      _this.recognizer.move = {};

      // recognizer.move: minimum distance needed until a move event gets dispatched
      // useful in scrolling elements to lock to a specific direction only after a few pixels of movement were detected
      // i.e. recognizer.move.x = 100  means that the element would visually not move until a minimum of 100 pixels in movement were reached
      _this.recognizer.move.x = 0;
      _this.recognizer.move.y = 0;


      // swipe recognizers, used for dispatching swipe events
      _this.recognizer.swipe = {};

      // recognizer.swipe.velocity: defines the minimum move-velocity needed until a swipe is dispatched
      // i.e. recognizer.swipe.velocity = 10  means that the element needs to be moved pretty fast to dispatch a swipe event
      _this.recognizer.swipe.velocity = 1;

      // recognizer.swipe.width: defines a minimum distance that needs to be moved in order to swipe
      // useful for sliders where passing half the container width means a swipe regardless of velocity
      // i.e. recognizer.swipe.width = 200  means that if the element was dragged by 200 pixels it will dispatch a swipe no matter what
      _this.recognizer.swipe.width = Number.MAX_VALUE;
      _this.recognizer.swipe.height = Number.MAX_VALUE;


      // TODO: implement tap and double tap recognizers via touchmouse
      // listen to all the events dispatched by parent class Transformable
      _this.addEventListener('start', _startTransform);
      _this.addEventListener('calc', _calc);
      _this.addEventListener('update', _update);
      _this.addEventListener('complete', _stopTransform);
    };

    /**
     * defines the scrolling direction used for elements that are intended to scroll in a specific direction
     * automatically stops events on parent containers and sets up all the needed settings
     *
     * @method scrolls
     * @param {String} direction defines the scroll direction
     * allowed values:
     * "x" or "horizontal"
     * "y" or "vertical"
     * "none" or "empty"
     **/
    _this.scrolls = function(direction){
      if (direction === 'x' || direction === 'horizontal') {
        _this.recognizer.move.x = 10;
        _this.recognizer.move.y = 0;
        _this.stops.tracking.x = null;
        _this.stops.tracking.y = 10;
        _this.stops.propagation.x = 10;
        _this.stops.propagation.y = 10;
      } else if (direction === 'y' || direction === 'vertical') {
        _this.recognizer.move.x = 0;
        _this.recognizer.move.y = 10;
        _this.stops.tracking.x = 10;
        _this.stops.tracking.y = null;
        _this.stops.propagation.x = 10;
        _this.stops.propagation.y = 10;
      } else {
        _this.recognizer.move.y = 0;
        _this.recognizer.move.x = 0;
        _this.stops.propagation.x = 0;
        _this.stops.propagation.y = 0;
        _this.stops.tracking.x = null;
        _this.stops.tracking.y = null;
      }
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
     * dispatches move event
     *
     * @method _dispatchTweenUpdate
     * @private
     **/
    var _dispatchTweenUpdate = function(){
      if (_this.lock) {
        _stopTween();
      }

      _this.dispatchEvent(MOVE);
    };

    /**
     * dispatches moveComplete event
     *
     * @method _dispatchComplete
     * @private
     **/
    var _dispatchComplete = function(){
      _this.dispatchEvent(MOVE_COMPLETE);
    };

    /**
     * stops previous tween
     * sets leveling if needed
     *
     * @method _startTransform
     * @private
     **/
    var _startTransform = function(event){
      _stopTween();
      if (_this.level && _this.parent) _this.parent.setChildIndex(_this, _this.parent.getNumChildren() - 1);
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
     * calculates movements based on individual changed finger positions
     * for current frame only. Only calculates. Does not set properties on element
     *
     * @method _calc
     * @private
     **/
    var _calc = function(event){
      // NOTE: TODO: remove _this.lock check for only dispatching events?
      if (_this.lock) return;

      // caluclate average movement between all points
      _this._calc.x = 0;
      _this._calc.y = 0;

      for (var pointerID in _this._fingers) {
        if (_this._fingers[pointerID].start) {
          _this._calc.x += (_this._fingers[pointerID].current.x - _this._fingers[pointerID].old.x);
          _this._calc.y += (_this._fingers[pointerID].current.y - _this._fingers[pointerID].old.y);
        }
      }

      // divide movement by fingers to get an average move of all fingers
      // i.e. when "pinching" proportionally no movement should occur
      _this._calc.x /= Math.max(1, _this._activeFingers);
      _this._calc.y /= Math.max(1, _this._activeFingers);
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

      var _dispatchesUpdate = false;

      // check if tracked movements already passed move recognizer
      // add calculated values to current properties
      // hold border properties while taking elasticity and fractions into account

      if (Math.abs(_this._track.current.x) >= _this.recognizer.move.x) {
        _this._hold('x', _this, true, _this._calc.x * _this.fraction.move.x * _this.fraction.base);
        _this.recognizer.fired.x = true;
        _dispatchesUpdate = true;
      }

      if (Math.abs(_this._track.current.y) >= _this.recognizer.move.y) {
        _this._hold('y', _this, true, _this._calc.y * _this.fraction.move.y * _this.fraction.base);
        _this.recognizer.fired.y = true;
        _dispatchesUpdate = true;
      }

      if (_dispatchesUpdate) {
        _this.dispatchEvent(MOVE);
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
    var _stopTransform = function(event){
      if (_this._activeFingers > 0) return;
      if (_this.lock) return;

      // no change in position
      if (Math.abs(_this.velocity.delta.x) === 0 &&
        Math.abs(_this.velocity.delta.y) === 0 &&
        ! (_this.snap || _this.snap.x === 0) &&
        ! (_this.snap || _this.snap.y === 0)
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
        valuePair1.x = _this.x + _this.velocity.delta.x * _this.fraction.release.x * _this.fraction.base * _this.velocity.x;
        valuePair1.y = _this.y + _this.velocity.delta.y * _this.fraction.release.y * _this.fraction.base * _this.velocity.y;

        // snaps properties if defined
        if (_this.snap.x && _this.snap.x !== 0) {
          valuePair1.x = (Math.round(valuePair1.x / _this.snap.x) * _this.snap.x);
        }

        if (_this.snap.y && _this.snap.y !== 0) {
          valuePair1.y = (Math.round(valuePair1.y / _this.snap.y) * _this.snap.y);
        }

        // hold borders while taking elasticity into account
        _this._hold('x', valuePair1, true);
        _this._hold('y', valuePair1, true);

        options.bezier.values.push(valuePair1);


        // hold borders again without taking elasticity into account
        // TODO: check if saves performance to first check if elastic is set. otherwise valuePairs will be identical anyways
        var valuePair2 = {};
        valuePair2.x = valuePair1.x;
        valuePair2.y = valuePair1.y;
        _this._hold('x', valuePair2, false);
        _this._hold('y', valuePair2, false);


        var speedFraction = 1;
        var distance = 0;

        // if did not throw beyond borders
        // i.e. if the first and second value pairs for throwing out and back are identical
        if (valuePair2.x === valuePair1.x && valuePair2.y === valuePair1.y) {
          distance = _getDistance(_this, valuePair2);
        } else {
          options.bezier.values.push(valuePair2);
          distance = _getDistance(_this, valuePair1) + _getDistance(valuePair1, valuePair2);
          speedFraction = 0.75;
        }

        var speed = distance / 5 / 100 / _this.fraction.speed.move * speedFraction;
        speed = Math.min(speed, _this.fraction.speed.max.move);

        options.ease = Cubic.easeOut;
        options.onComplete = _dispatchComplete;
        options.onUpdate = _dispatchTweenUpdate;
        options.overwrite = 'auto';

        _stopTween();

        if (speed === 0) {
          _this.x = valuePair2.x;
          _this.y = valuePair2.y;
          _dispatchComplete();
        } else {
          _tween = TweenLite.to(_this, speed, options);
        }

        _detectSwipes();
      }
    };


    /**
     * detects swipe events.
     * calculates distances and velocities based on x- and y movements.
     * if a swipe was detected dispatches appropriate event.
     *
     * @method _detectSwipes
     * @private
     **/
    var _detectSwipes = function(){
      if (! _this.hasEventListener(SWIPE)) return;

      // do not dispatch swipe if more than one finger was used when moving an element (i.e. scaling / rotating)
      if (! _this._hadMultipleFingers) {
        var event = null;
        var swipe = null;
        var orientation = null;

        // do not allow two swipe calls at once.
        // even if it would be a swipe: when one direction gets pulled farther or faster than the other one: don't dispatch!

        // NOTE: favor velocity instead of whole movement
        // i.e. even if an element was moved 1000 pixels to the left, but then pulled up fastly -> vertical swipe
        if (_this.velocity.x > 0 && _this.velocity.x > _this.velocity.y) orientation = 'horizontal';
        else if (_this.velocity.y > 0 && _this.velocity.y > _this.velocity.x) orientation = 'vertical';
        else {
          // if no swiping direction was found through velocity: check absolute movement values
          if (Math.abs(_this._track.current.x) > Math.abs(_this._track.current.y)) orientation = 'horizontal';
          else if (Math.abs(_this._track.current.y) > Math.abs(_this._track.current.x)) orientation = 'vertical';
        }

        // check for swipes if an orientation towards a specific direction was detected
        if (orientation === 'horizontal' || orientation === 'vertical') {
          var p = SWIPE_PROPERTIES[orientation];

          // first: check if movement passed defined swipe direction
          // moving past a defined fraction (i.e. half width of a slider)
          // means a swipe in any case, regardless of swiping velocity
          if (_this._track.current[p.axis] < 0 - _this.recognizer.swipe[p.size]) swipe = p.prev;
          else if (_this._track.current[p.axis] > _this.recognizer.swipe[p.size]) swipe = p.next;

          // second: check if move velocity was higher than the minimum definition
          // if so: overwrite existing checks or reset swiping if would actually swiped in one direction but then fastly moved in the other direction
          // i.e. someone could move beyound the minimum width for a swipe but then move back fastly -> swipe back
          if (_this.velocity[p.axis] > _this.recognizer.swipe.velocity && _this.velocity.direction[p.axis] < 0) {
            swipe = swipe === p.next ? null : p.prev;
          } else if (_this.velocity[p.axis] > _this.recognizer.swipe.velocity && _this.velocity.direction[p.axis] > 0) {
            swipe = swipe === p.prev ? null : p.next;
          }
        }

        // if a swipe direction was found:
        // dispatch swipe event for use in child classes
        if (swipe) {
          event = new createjs.Event(SWIPE);
          event.orientation = orientation;
          event.direction = SWIPE_PROPERTIES.directions[swipe];
          event.swipe = swipe;
          event.velocity = _this.velocity[SWIPE_PROPERTIES[orientation].axis];
          _this.dispatchEvent(event);
        }
      }
    };


    // initialize instance
    Init();
  });
});
