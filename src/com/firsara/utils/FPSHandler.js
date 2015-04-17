/*
 * FPSHandler.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * helper class to handle fps ticking based on EaselJS Ticker
 */
define(['sys', 'EaselJS'], function(sys, createjs) {

  var Parent = createjs.EventDispatcher;

  return sys.Class({
    __extends: Parent
  },
  function FPSHandler(){
    // reference to instance
    var _this = this;

    // properties to calculate average fps
    var startTime = Date.now(), prevTime = startTime;
    var ms = 0, msMin = Infinity, msMax = 0;
    var fps = 0, fpsMin = Infinity, fpsMax = 0;
    var frames = 0;
    var average = 0;
    var combinedFPS = 0;
    var ticked = 0;

    var _averageFPSTicks = [];

    // basic configuration
    // NOTE: RAF will not go beyond 60 fps (which does not make a lot of sense anyway)
    // TODO: override and inherit in application's FPS child class?
    _this.config = {
      fps: 60,
      targetFPS: 60,
      minFPS: 30,
      timingMode: createjs.Ticker.RAF_SYNCHED
    };

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor
      if (Parent) Parent.call(this);

      // check if FPSHandler was instanciated more than once
      if (_this.Class.instance) throw new Error('FPSHandler is a singleton Class');
      _this.Class.instance = _this;

      // set easeljs timing mode to configured one (shouldn't be a different than RAF = requestAnimationFrame)
      createjs.Ticker.timingMode = _this.config.timingMode;

      // set preferred fps that application should render
      createjs.Ticker.setFPS(_this.config.fps);

      // if stats.js is included run a different function updater
      if (window.stats) {
        createjs.Ticker.addEventListener('tick', _updateStats);
      } else {
        createjs.Ticker.addEventListener('tick', _update);
      }

      // check current fps all 10 seconds
      setInterval(_checkFPS, 10000);

      // adjust fps every minute if big lags have been detected
      setInterval(_updateFPS, 60000);
    };

    /**
     * delegate application rendering
     * calculates fps through stats.js
     *
     * @method _updateStats
     * @private
     **/
    var _updateStats = function(e){
      _begin();

      window.stats.begin();

      // TODO: deprecated. use reality in box2d child abstractor class
      if (_this.reality) {
        _this.reality.update(e);
      }

      _this.dispatchEvent(e);

      window.stats.end();

      _end();
    };


    /**
     * delegate application rendering
     * tracks fps for further potential adjustments if lags were detected
     *
     * @method _update
     * @private
     **/
    var _update = function(e){
      _begin();

      // TODO: deprecated. use reality in box2d child abstractor class
      if (_this.reality) {
        _this.reality.update(e);
      }

      _this.dispatchEvent(e);

      _end();
    };

    /**
     * track average fps every x seconds defined through setInterval
     * assume a downtime of 10 frames is ok and could happen
     *
     * @method _checkFPS
     * @private
     **/
    var _checkFPS = function(){
      _averageFPSTicks.push(Math.round(average + 10));
      _resetAverage();
    };

    /**
     * adjust current fps based on downtimes
     * i.e. if a big lag is detected throughout about one minute -> throttle fps down a bit
     *
     * @method _updateFPS
     * @private
     **/
    var _updateFPS = function(){
      var correctedFPSTicks = [];
      var averageFPS = 0;

      // get highest and lowest fps in average ticks
      var lowestFPSTick = Math.min.apply(Math, _averageFPSTicks);
      var highestFPSTick = Math.max.apply(Math, _averageFPSTicks);

      // calculate average fps throughout all the tick averages
      for (var i = 0, _len = _averageFPSTicks.length; i < _len; i++) {
        // ignore lowest FPS tick (extreme downtimes can happen)
        if (_averageFPSTicks[i] === lowestFPSTick) {
          correctedFPSTicks.push(_averageFPSTicks[i]);
          averageFPS += _averageFPSTicks[i];
        }
      }

      averageFPS = averageFPS / (correctedFPSTicks.length - 1);

      // assume 10 frames of a downtime can happen and are normal
      var newFPS = Math.round(averageFPS + 10);

      // for any calculation errors use target fps instead
      if (isNaN(newFPS)) {
        newFPS = _this.config.targetFPS;
      }

      // don't go lower than configured min fps and not higher than target fps
      _this.config.fps = Math.max(_this.config.minFPS, Math.min(_this.config.targetFPS, newFPS));
      createjs.Ticker.setFPS(_this.config.fps);

      _averageFPSTicks = [];
    };

    /**
     * begin tracking fps
     *
     * @method _begin
     * @private
     **/
    var _begin = function(){
      startTime = Date.now();
    };

    /**
     * stop tracking fps
     *
     * @method _end
     * @private
     **/
    var _end = function(){
      var time = Date.now();

      ms = time - startTime;
      msMin = Math.min(msMin, ms);
      msMax = Math.max(msMax, ms);

      frames++;

      if (time > prevTime + 1000) {
        fps = Math.round((frames * 1000) / (time - prevTime));
        fpsMin = Math.min(fpsMin, fps);
        fpsMax = Math.max(fpsMax, fps);

        prevTime = time;
        frames = 0;

        if (fps > 15) {
          ticked++;
          combinedFPS += fps;
          average = combinedFPS / ticked;
        }
      }

      return time;
    };

    /**
     * resets calculated average fps calculations
     *
     * @method _resetAverage
     * @private
     **/
    var _resetAverage = function(){
      combinedFPS = 0;
      average = 0;
      ticked = 0;
    };

    // initialize instance
    Init();
  });
});
