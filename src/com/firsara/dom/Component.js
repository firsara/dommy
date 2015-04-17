/*
 * Component.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * A component is a set of layout elements with a render and interaction logic baked in
 * automatically calls render, dispose and resize in child class
 *
 * public functions that need to be overridden by child classes:
 *
 * _this.init: binds events
 * _this.dispose: unbinds events and destroy possible elements
 * _this.render: renders data
 * _this.unrender: unrenders data
 * _this.resize: called when window was resized
 */
define([
  'sys',
  'dom/Container'
], function(
  sys,
  Container
) {
  var Parent = Container;

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class Component
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Component(template, data, options){
    // instance
    var _this = this;

    // stored component size, @public
    _this._componentWidth = 0;
    _this._componentHeight = 0;

    // store timeouts
    var _doRenderTimeout = null;
    var _doResizeTimeout = null;

    // store first render and resize calls
    var _didRender = false;
    var _didResize = false;

    // stored, old component size
    var _oldComponentWidth = 0;
    var _oldComponentHeight = 0;

    /**
     * @constructor
     **/
    var Init = function(){
      // call super constructor
      if (Parent && ! _this._initialized) Parent.call(_this, template, data, options);

      // don't autoPaint component by default
      _this.autoPaint = false;

      // initialize when added to stage
      _this.addEventListener('addedToStage', _this.init);
    };

    // store original child functions and replace them with noop function to catch possible errors when calling them
    var _noop = function(){};

    var _childFunctions = {};
    _childFunctions.init = _this.init || _noop;
    _childFunctions.dispose = _this.dispose || _noop;
    _childFunctions.render = _this.render || _noop;
    _childFunctions.unrender = _this.unrender || _noop;
    _childFunctions.resize = _this.resize || _noop;

    /**
     * binds events in child class
     *
     * @method init
     * @protected
     **/
    _this.init = function(){
      _this.removeEventListener('addedToStage', _this.init);

      _this.addEventListener('removedFromStage', _this.dispose);

      // NOTE: $(window).trigger('resize') does not fire addEventListener
      //window.addEventListener('resize', _this.resize);
      $(window).bind('resize', _this.resize);

      _childFunctions.init();
      _this.resize();
    };

    /**
     * unbinds events in child class
     *
     * @method dispose
     * @protected
     **/
    _this.dispose = function(){
      //window.removeEventListener('resize', _this.resize);
      $(window).unbind('resize', _this.resize);
      _this.removeEventListener('removedFromStage', _this.dispose);

      _childFunctions.dispose();
    };

    /**
     * renders child component
     *
     * @method render
     * @protected
     **/
    _this.render = function(){
      // catch possible multiple calls of render
      // allow first render to happen immediately
      if (_doRenderTimeout || _didRender) {
        clearTimeout(_doRenderTimeout);
        _doRenderTimeout = setTimeout(_childFunctions.render, 17);
      } else {
        _didRender = true;
        _childFunctions.render();
      }
    };

    /**
     * unrenders child component
     * NOTE: this is not really used by a lot of components use when needed
     * can be called publicly from a template controller
     *
     * @method unrender
     * @public
     **/
    _this.unrender = function(){
      _childFunctions.unrender();
    };

    /**
     * resizes child component
     *
     * @method resize
     * @protected
     **/
    _this.resize = function(){
      // catch possible multiple calls of resize
      // allow first resizing to happen immediately
      if (_doResizeTimeout || _didResize) {
        clearTimeout(_doResizeTimeout);
        _doResizeTimeout = setTimeout(_doResize, 17);
      } else {
        _didResize = true;
        _doResize();
      }
    };

    /**
     * executes resizing
     *
     * @method _doResize
     * @private
     **/
    var _doResize = function(){
      // store component sizes
      _this._componentWidth = _this.$el.width();
      _this._componentHeight = _this.$el.height();

      // if sizes changed -> call child resize function to save some performance
      if (! (_this._componentWidth === _oldComponentWidth && _this._componentHeight === _oldComponentHeight)) {
        _oldComponentWidth = _this._componentWidth;
        _oldComponentHeight = _this._componentHeight;
        _childFunctions.resize();
        _this.render();
      }
    };

    // initialize instance
    Init();
  });
});
