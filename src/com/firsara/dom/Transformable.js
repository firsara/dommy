/*
 * Transformable.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * Transformable extends Container
 *
 * Transformable container base class for transforming shapes
 * keeps track of fingers, sub-classes can calculate values based on finger positions
 *
 * dispatches events:
 * start, track, calc, update, complete
 */
define(['sys', 'EaselJS', 'dom/Container'], function(sys, createjs, Container) {

  // TODO: make parent and touch events dynamic so that the same class can be used for easeljs container or html container
  var Parent = Container;

  // Event constants

  // start gets dispatched when a new finger was detected
  var START = 'start';

  // calc gets dispatched to let child classes calculate transformations
  var CALC = 'calc';

  // update gets dispatched after calculations are done
  var UPDATE = 'update';

  // complete gets called after a finger was released
  var COMPLETE = 'complete';

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class Transformable
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Transformable(template, data, options){
    // reference to instance
    var _this = this;

    // fractions:
    // move: how much finger movements transform
    // release: how much fade-out tweening after releasing fingers transform
    // base: base fraction to adjust move, release, speed etc. fractions (not recommended changing)
    _this.fraction = {base: 1, move: {}, release: {}, speed: {max: {}}, velocity: {max: {}}};

    // numeric value to snap transformations by x
    _this.snap = {};

    // freely transformable by property, overwrites borders if true
    _this.free = {};

    // borders for specific values get stored here
    _this.borders = {};

    // velocity: calculated velocity of current move speed, re-calculated every x frames
    // note: read-only
    _this.velocity = {x: 0, y: 0, scale: 0, rotation: 0, direction: {}, delta: {}};

    // elastic property expansion (over borders)
    _this.elastic = {};

    // recognizer event settings
    _this.recognizer = {fired: {}};

    // event tracking and propagation settings
    _this.stops = {tracking: {}, propagation: {}};

    // lock transformations regardless of other values
    _this.lock = false;


    // protected values
    // NOTE: read-only, don't modify from outside!
    // currently active fingers
    _this._activeFingers = 0;

    // finger positions
    _this._fingers = [];
    _this._hadMultipleFingers = false;

    // tracked calculations
    _this._track = {};

    // calculated transformation values
    _this._calc = {};

    // helper variables
    var _changed = false;
    var _started = false;
    var _stoppedTracking = false;
    var _stoppedPropagation = false;

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(_this, template, data, options);

      // set autoPainting by default to true
      _this.autoPaint = true;

      // define class to be initialized (useful for multiple mixins so that base class (Container) does not get initialized twice)
      _this._initialized = true;

      _this.on('added', _render, _this);
      _this.on('removed', _dispose, _this);
    };

    /**
     * adds a specific value (chanbeBy) to a specific property
     * and holds borders accordingly based on if it should keep elasticity or not
     * i.e. when dragging outside borders and keeping elasticity it will go beyond borders
     *
     * @method _hold
     * @param {String} prop the property which borders should be held
     * @param {object} obj the object on which to hold borders (can be a plain {}-object, does not have to be a Transformable instance)
     * @param {Boolean} keepElastic if elasicity should be taken into account or if it should just stick to plain borders
     * @param {Number} changeBy change held property by x, used in conjunction with keepElastic when calculating transformations
     * @protected
     **/
    _this._hold = function(prop, obj, keepElastic, changeBy){
      // set elasticity based on keepElastic
      var elasticity = keepElastic ? _this.elastic[prop] : 0;

      // defines property to check on (simplify scale check)
      var objProp = prop === 'scale' ? 'scaleX' : prop;

      // if changeBy is not set
      if (isNaN(changeBy)) {
        // assume changeBy is the value that's out of border range
        // used in throwing at _stopTransform
        // if out of borders, set property to equal borders and set changeBy to be value that's out of border range
        if (obj[objProp] < _this.borders[prop][0]) {
          changeBy = obj[objProp] - _this.borders[prop][0];
          obj[objProp] = _this.borders[prop][0];
        } else if (obj[objProp] > _this.borders[prop][1]) {
          changeBy = obj[objProp] - _this.borders[prop][1];
          obj[objProp] = _this.borders[prop][1];
        } else {
          changeBy = 0;
        }

        // when already out of bounds: keep it more towards bounds than it would be through throwing
        changeBy = changeBy / 2.25;
      }

      var value = obj[objProp];
      obj[objProp] += changeBy;

      // if property is not affected by bounds
      if (! _this.free[prop]) {
        // if property is out of bound
        if (obj[objProp] < _this.borders[prop][0]) {
          // if should keep elasticity
          if (keepElastic && elasticity) {
            // set value to be at border range plus needed changeBy value while taking ealsticity into account
            obj[objProp] = value + changeBy * elasticity;
          } else {
            obj[objProp] = _this.borders[prop][0];
          }
        } else if (obj[objProp] > _this.borders[prop][1]) {
          if (keepElastic && elasticity) {
            obj[objProp] = value + changeBy * elasticity;
          } else {
            obj[objProp] = _this.borders[prop][1];
          }
        }
      }

      // for scaling set scaleY to be equal to scaleX
      if (prop === 'scale') {
        obj.scaleY = obj.scaleX;
      }
    };

    /**
     * initializes events on transformable object
     *
     * @method _render
     * @private
     **/
    var _render = function(){
      _this.$el.addEventListener('touchmousedown', _mousedown);
    };

    /**
     * unbinds events on transformable object
     *
     * @method _dispose
     * @private
     **/
    var _dispose = function(){
      _this.$el.removeEventListener('touchmousedown', _mousedown);
    };

    /**
     * calculates velocity based on tracked transformations
     * gets called every 10 frames and on stopped transformation to have a more accurate and up to date value
     *
     * @method _calculateVelocity
     * @private
     **/
    var _calculateVelocity = function(){
      var now = new Date().getTime();
      var deltaTime = now - _this._track.time;

      // velocity.delta = absolute value that has changed since last check
      _this.velocity.delta.x = _this._track.current.x - _this._track.start.x;
      _this.velocity.delta.y = _this._track.current.y - _this._track.start.y;
      _this.velocity.delta.scale = _this._track.current.scale - _this._track.start.scale;
      _this.velocity.delta.rotation = _this._track.current.rotation - _this._track.start.rotation;

      // velocity.direction = -1 / 1, the direction in which the transformation was detected
      _this.velocity.direction.x = _this.velocity.delta.x === 0 ? 0 : (_this.velocity.delta.x > 0 ? 1 : -1);
      _this.velocity.direction.y = _this.velocity.delta.y === 0 ? 0 : (_this.velocity.delta.y > 0 ? 1 : -1);
      _this.velocity.direction.scale = _this.velocity.delta.scale === 0 ? 0 : (_this.velocity.delta.scale > 0 ? 1 : -1);
      _this.velocity.direction.rotation = _this.velocity.delta.rotation === 0 ? 0 : (_this.velocity.delta.rotation > 0 ? 1 : -1);

      // velocity = the calculated velocity, based delta and time
      _this.velocity.x = deltaTime === 0 ? 0 : Math.abs(_this.velocity.delta.x / deltaTime);
      _this.velocity.y = deltaTime === 0 ? 0 : Math.abs(_this.velocity.delta.y / deltaTime);
      _this.velocity.scale = deltaTime === 0 ? 0 : Math.abs(_this.velocity.delta.scale / deltaTime);
      _this.velocity.rotation = deltaTime === 0 ? 0 : Math.abs(_this.velocity.delta.rotation / deltaTime);

      // keep defined maximum velocity
      _this.velocity.x = Math.min(_this.velocity.x, _this.fraction.velocity.max.x);
      _this.velocity.y = Math.min(_this.velocity.y, _this.fraction.velocity.max.y);
      _this.velocity.scale = Math.min(_this.velocity.scale, _this.fraction.velocity.max.scale);
      _this.velocity.rotation = Math.min(_this.velocity.rotation, _this.fraction.velocity.max.rotation);
    };

    /**
     * stores initial finger-positions
     * initializes other mousemove and mouseup events
     * prevents default event behaviour
     * stops propagation if needed (used in nested scrollable containers)
     *
     * @method _mousedown
     * @private
     **/
    var _mousedown = function(event){
      // prevent event propagation if it should do
      if (_stoppedPropagation) {
        event.stopPropagation();
      }

      // prevent default move behaviour
      event.preventDefault();

      // remove old events to ensure no event gets bound two times
      _this.stage.removeEventListener('touchmousemove', _pressmove);
      _this.stage.removeEventListener('touchmouseup', _pressup);
      _this.removeEventListener('tick', _enterFrame);

      // add events to keep track of finger positions
      _this.stage.addEventListener('touchmousemove', _pressmove);
      _this.stage.addEventListener('touchmouseup', _pressup);
      _this.addEventListener('tick', _enterFrame);

      // setup initial finger position of detected event
      _this._fingers[event.pointerID] = {
        start: {x: event.pageX, y: event.pageY},
        current: {x: event.pageX, y: event.pageY},
        old: {x: event.pageX, y: event.pageY}
      };

      // setup initial tracking configuration
      _this._track.ticks = 0;
      _this._track.time = new Date().getTime();
      _this._track.start = {x: 0, y: 0, scale: 0, rotation: 0};
      _this._track.current = {x: 0, y: 0, scale: 0, rotation: 0};

      // reset velocity
      _calculateVelocity();

      // calculate active fingers
      _calculateActiveFingers();

      // store that transformable had multiple fingers, if so
      if (_this._activeFingers > 1) {
        _this._hadMultipleFingers = true;
      }

      // tell transformable that it has started tracking
      _started = true;

      // dispatch start event for use in child classes
      _this.dispatchEvent(START);
    };

    /**
     * stores new finger positions
     *
     * @method _pressmove
     * @private
     **/
    var _pressmove = function(event){
      // prevent event propagation if it should do
      if (_stoppedPropagation) {
        event.stopPropagation();
      }

      // security check. finger with event's pointerID sould be defined anyways
      if (_this._fingers[event.pointerID]) {
        _this._fingers[event.pointerID].current.x = event.pageX;
        _this._fingers[event.pointerID].current.y = event.pageY;

        // calculate active fingers
        _calculateActiveFingers();

        // tell transformable that finger positions changed
        _changed = true;
      }
    };

    /**
     * if positions changed (through pressmove): dispatch update-event for later usage and keep track of old point-position
     * dispatch updates only on tick to save some performance
     *
     * if positions did not changed: track old position anyways for velocity calculations
     * i.e. if user did not move for a long time velocity should equal 0
     *
     * @method _enterFrame
     * @private
     **/
    var _enterFrame = function(){
      // ignore if transformable should not track movements anymore
      // i.e. for scrollable elements that only make use of one scroll direction
      // if an element scrolls in 'y' and the user moved towards 'x' the transformable should stop checking 'y'
      // as the user apparently wanted to drag 'x'
      if (_stoppedTracking) {
        return;
      }

      // if finger positions changed
      if (_changed) {
        // tell transformable that it noticed the change
        _changed = false;

        // assume calculations equal 0
        // useful if child class does not calculate anyhthing at all
        _this._calc.x = 0;
        _this._calc.y = 0;
        _this._calc.scale = 0;
        _this._calc.rotation = 0;

        // dispatch calc event and let child classes calculate transformations
        _this.dispatchEvent(CALC);

        // re-assign current finger positions to old stored positions
        // i.e. old and current finger positions get used in child classes to calculate transformations
        for (var pointerID in _this._fingers) {
          if (_this._fingers[pointerID].start) {
            _this._fingers[pointerID].old.x = _this._fingers[pointerID].current.x;
            _this._fingers[pointerID].old.y = _this._fingers[pointerID].current.y;
          }
        }

        // track transformations
        _this._track.current.x += _this._calc.x;
        _this._track.current.y += _this._calc.y;
        _this._track.current.scale += _this._calc.scale;
        _this._track.current.rotation += _this._calc.rotation;


        // TODO: NOTE: only stop tracking individual property

        // tell transformable to stop future transformations if tracked position exceeded configured stops.propagation[prop]
        // this gets used in scrollable nested containers whereas one container scrolls 'x' and the nested one 'y'
        if (_this.stops.propagation.x && Math.abs(_this._track.current.x) > _this.stops.propagation.x)
          _stoppedPropagation = true;
        if (_this.stops.propagation.y && Math.abs(_this._track.current.y) > _this.stops.propagation.y)
          _stoppedPropagation = true;

        // tell transformable to stop tracking values if tracked position exceeded configured stops.tracking[prop]
        // and did not recognize a move in the other direction already
        // i.e. if it should stop tracking at x = 10 but user already moved beyond y = 10 then it's ok
        // this gets used in scrollable nested containers whereas one container scrolls 'x' and the nested one 'y'
        if (_this.stops.tracking.x && Math.abs(_this._track.current.x) > _this.stops.tracking.x && ! _this.recognizer.fired.y)
          _stoppedTracking = true;
        if (_this.stops.tracking.y && Math.abs(_this._track.current.y) > _this.stops.tracking.y && ! _this.recognizer.fired.x)
          _stoppedTracking = true;

        // dispatch update event for use in child classes that make use of newly calculated positions
        _this.dispatchEvent(UPDATE);
      }

      // if transformable started tracking (i.e. if it has one active finger)
      if (_started) {
        // track frame ticks and update velocity every 10 frames
        // gets better average values than taking the complete time into account
        _this._track.ticks++;

        if (_this._track.ticks > 10) {
          _calculateVelocity();

          // reset tracking values
          _this._track.start.x = _this._track.current.x;
          _this._track.start.y = _this._track.current.y;
          _this._track.start.scale = _this._track.current.scale;
          _this._track.start.rotation = _this._track.current.rotation;
          _this._track.ticks = 0;
          _this._track.time = new Date().getTime();
        }
      }
    };

    /**
     * delete old and unused finger-positions
     * dispatches complete event and re-calculates velocity if needed
     *
     * @method _pressup
     * @private
     **/
    var _pressup = function(event){
      // prevent event propagation if it should do
      if (_stoppedPropagation) {
        event.stopPropagation();
      }

      // security check. finger with event's pointerID sould be defined anyways
      if (_this._fingers[event.pointerID]) {
        delete(_this._fingers[event.pointerID]);
      }

      // calculate active fingers
      _calculateActiveFingers();

      // if no active finger was detected anymore -> unbind events completely and reset start behavior
      if (_this._activeFingers === 0) {
        _this.stage.removeEventListener('touchmousemove', _pressmove);
        _this.stage.removeEventListener('touchmouseup', _pressup);
        _this.removeEventListener('tick', _enterFrame);

        _changed = false;
        _started = false;
        _stoppedPropagation = false;
        _stoppedTracking = false;

        _this.recognizer.fired = {};
      }

      // calculate end velocity
      if (_this._track.ticks > 2) {
        _calculateVelocity();
      }

      // dispatch complete event
      _this.dispatchEvent(COMPLETE);

      // reset multiple finger check
      if (_this._activeFingers === 0) {
        _this._hadMultipleFingers = false;
      }
    };

    /**
     * calculates currently active fingers, can be used later in subclasses
     *
     * @method _calculateActiveFingers
     * @private
     **/
    var _calculateActiveFingers = function(){
      _this._activeFingers = 0;

      for (var pointerID in _this._fingers) {
        if (_this._fingers[pointerID].start) {
          _this._activeFingers++;
        }
      }
    };

    // initialize instance
    Init();
  });
});
