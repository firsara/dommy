/*
 * Container.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * Base class of all other dom classes
 * gets extended by MoveClip, Component, etc.
 *
 * handles child dom containers
 * keeps transformation properties stored (i.e. x, y, rotation, etc.)
 * optionally autoPaints transformations to css
 *
 * automatically sets defines name of child component in parent as a property
 * names are defined through data-name in templates
 *
 * example:
 * <div class="wrapper" data-name="wrapper">
 *   <div data-name="mover" data-class="dom/MoveClip"> <!-- mover will be a MoveClip instance -->
 *     DATA
 *   </div>
 * </div>
 *
 * var container = new Container($('.wrapper'));
 * container.mover.el.innerHTML; // outputs -> "DATA"
 */
define([
  'sys',
  'utils/css3',
  'EaselJS',
  'fps',
  'utils/ArrayUtils'
], function(
  sys,
  css3,
  createjs,
  fps,
  ArrayUtils
) {
  var Parent = createjs.EventDispatcher;

  // incremental container prefix id. generates a character like "A", "B", etc.
  var storedContainerPrefixID = 0;

  // incremental container id
  var storedContainerID = 0;

  // max container id before prefix id gets incremented
  var maxStoredContainerID = Number.MAX_VALUE;

  return sys.Class({
    __extends: Parent
  },
  /**
   * @class Container
   * @param {Handlebars} template should be a compiled handlebars template
   * alternatively can be a plain string or jquery object
   * @param {object} data the data to pass through the template, optional
   * @param {object} options optional options to overwrite container properties before inheriting
   **/
  function Container(template, data, options){
    // initialize static properties
    if (! Container.storage) {
      Container.storage = {};
    }

    // reference to instance
    var _this = this;

    // generates ids from 0 to MAX_VALUE
    // then setps up one character and generates again (A0, A1, A2, etc.)
    storedContainerID++;

    // if stored containerID surpassed max defined id
    if (storedContainerID > maxStoredContainerID - 2) {
      // reset container id and increment prefix id
      storedContainerID = 0;
      storedContainerPrefixID++;
    }

    // generate container id based on prefix id
    var containerID = storedContainerID;

    // if prefix id needs to be used
    if (storedContainerPrefixID > 0) {
      // generate character, starting at "A". This method should lead to pretty much infinite possible ids
      containerID = String.fromCharCode(storedContainerPrefixID + 64) + containerID;
    }

    // cache container in static Container.storage
    Container.storage[storedContainerID] = _this;


    // CUSTOM PUBLIC PROPERTIES
    // ------------------------

    // passed stored data
    _this.data = null;

    // cached jquery element
    _this.$el = null;

    // cached dom element
    _this.el = null;

    // TRANSFORMATIONS
    // ---------------
    _this.x = 0;
    _this.y = 0;
    _this.z = 0;
    _this.rotation = 0;
    _this.rotationX = 0;
    _this.rotationY = 0;
    _this.rotationZ = 0;
    _this.scaleX = 1;
    _this.scaleY = 1;


    // SPECIAL CONTAINER PROPERTIES
    // ----------------------------

    // container name, gets regenerated if data-name was detected
    _this.name = 'container_' + storedContainerID;

    // stored container id
    _this._containerID = storedContainerID;

    // stored dynamically assigned children
    _this.dynamicChildren = {};


    // TRAVERSAL PROPERTIES
    // --------------------

    // cached stage instance (for dom containers should always be <body>)
    _this.stage = null;

    // parent container object
    _this.parent = null;

    // stored children, simple array in order of appearance
    _this.children = [];


    // CONFIGURATION PROPERTIES
    // ------------------------

    // autoPaint transformations to css every frame
    _this.autoPaint = false;

    // automatically dispatch update events every frame for use in child classes
    _this.autoUpdate = true;

    // store container painting to prevent double paints
    var _painted = false;

    /**
     * fetches a container instance by passing in a jquery object
     * automatically disables autoUpdate on fetched container
     * only usefor for simple dom traversal, not for real components
     * gets used for child dom nodes when creating a new container
     * automatically creates a new class instance based on data-class
     * example:
     * Container.fetch('<div name="mover" data-class="dom/MoveClip"></div>');
     *
     * @method fetch
     * @param {jQuery} $el the jquery object that the container should handle
     * @static
     **/
    Container.fetch = function($el){
      // fetch defined container class through data-class
      var className = $el.attr('data-class');

      // assume it's a simple container
      var ClassTemplate = Container;

      // otherwise require class
      // NOTE: class has to be already in require registry
      if (className) {
        ClassTemplate = require(className);
      }

      // create new class instance and set autoPainting and autoUpdating to false by default to save some performance
      var ct = new ClassTemplate($el, null, {autoUpdate: false, autoPaint: false});
      ct.autoUpdate = false;
      ct.autoPaint = false;

      return ct;
    };

    /**
     * creates a container instance based on an html string
     *
     * @method create
     * @param {String} html defines the scroll direction
     * @static
     **/
    Container.create = function(html){
      var $el = $(html);
      return Container.fetch($el);
    };

    /**
     * gets a specific container from storage based on id
     *
     * @method getById
     * @param {String} id the container id that should be fetched
     * @static
     **/
    Container.getById = function(id){
      if (Container.storage[id]) {
        return Container.storage[id];
      }

      return null;
    };

    /**
     * @constructor
     **/
    var Init = function(){
      // call parent constructor
      if (Parent) Parent.call(_this);

      // if options were passed: run through them and overwrite container properties
      if (options) {
        for (var k in options) {
          if (_this.hasOwnProperty(k)) {
            _this[k] = options[k];
          }
        }
      }

      // store data if any was passed
      if (data) {
        _this.data = data;
      }

      // store data if any was passed
      if (template) {
        // assume template was a plain html string
        var html = template;

        // if template was a handlebars template -> compile it by using passed data
        if (typeof template === 'function') {
          html = template(data);
        }

        // cache dom element as jquery object
        _this.$el = $(html);

        // check if only one main node was passed
        // TODO: create ContainerList object for this kind of operations?
        if (_this.$el.size() > 1) {
          throw new Error('Container must only contain 1 target html element, not a list of dom elements');
        }

        // store container through jquery data
        _this.$el.data('container', _this);

        // cache plain html dom element
        _this.el = _this.$el.get(0);

        // get container name if any is set
        var elName = _this.$el.attr('data-name');

        if (elName) {
          _this.name = elName;
        } else {
          // TODO: NOTE: unused overhead?
          elName = _this.$el.attr('class');
          if (elName) {
            elName = elName.replace(' ', '').replace('-', '');
            _this.name = elName;
          } else {
            // TODO: NOTE: unused overhead?
            elName = _this.$el.prop('tagName');
            if (elName) {
              _this.name = elName;
            }
          }
        }

        // traverse all dom children and auto-fetch containers, set parent etc.
        _this.$el.children().each(function(){
          var child = Container.fetch($(this));

          child.parent = _this;
          child.stage = _this.stage;
          _this.children.push(child);
          child._added();
        });
      } else {
        throw new Error('Container needs a template (Handlebars, html string, jquery element)');
      }

      // listen to dom added event
      _this.on('added', _render, _this);
    };

    /**
     * sets autoUpate on container
     *
     * @method setAutoUpdate
     * @param {Boolean} value true or false
     **/
    _this.setAutoUpdate = function(value){
      _this.autoUpdate = value;
      _checkRendering();
    };

    /**
     * sets autoPaint on container
     *
     * @method setAutoPaint
     * @param {Boolean} value true or false
     **/
    _this.setAutoPaint = function(value){
      _this.autoPaint = value;
      _checkRendering();
    };

    /**
     * sets zIndex of a child and automatically re-assigns z-indices of its siblings
     *
     * @method setChildIndex
     * @param {Container} child the child that needs a new index
     * @param {Number} index the preferred index
     **/
    _this.setChildIndex = function(child, index){
      var kids = _this.children, _len = kids.length, i;
      if (child.parent !== _this || index < 0 || index >= _len) {
        return;
      }

      for (i = 0; i < _len; i++) {
        if (kids[i] === child) {
          break;
        }
      }

      if (i === _len || i === index) {
        return;
      }

      // resorts children array
      kids.splice(i, 1);
      kids.splice(index, 0, child);

      // set zIndex by looping through indices
      for (i = 0; i < _len; i++) {
        kids[i].el.style.zIndex = i;
      }
    };

    /**
     * removes the dom container at a specific index
     * returns removed child for future use
     *
     * @method removeChildAt
     * @param {Number} index of the dom element to be removed
     **/
    _this.removeChildAt = function(index) {
      var kids = _this.children;

      if (kids[index]) {
        var child = kids[index];

        if (! (child && child.$el)) {
          throw new Error('removeChildAt expects child to be a container');
        }

        _this.children.splice(index, 1);
        child.$el.remove();
        child._removed();

        return child;
      }

      return false;
    };

    /**
     * removes all children.
     * NOTE: this is not the same than calling $el.html('');
     * it runs through all children and dispatches appropriate events
     *
     * @method removeAllChildren
     **/
    _this.removeAllChildren = function() {
      var kids = _this.children;
      while (kids.length) {
        _this.removeChildAt(0);
      }
    };

    /**
     * gets child at a specific index from children list
     *
     * @method getChildAt
     * @param {Number} index of the dom element to be removed
     **/
    _this.getChildAt = function(index) {
      return _this.children[index];
    };

    /**
     * determines the index of a container in a child list
     *
     * @method getChildIndex
     * @param {Container} child the container from which the index needs to be determined
     **/
    _this.getChildIndex = function(child) {
      return createjs.indexOf(_this.children, child);
    };

    /**
     * returns the number of children in a container
     *
     * @method getNumChildren
     **/
    _this.getNumChildren = function() {
      return _this.children.length;
    };

    /**
     * adds a child container to the current one
     * calls added event and checks for stage later on
     *
     * @method addChild
     * @param {Container} child the container that should be added
     **/
    _this.addChild = function(child){
      if (! (child && child.$el)) {
        throw new Error('addChild expects child to be a container');
      }

      child.parent = _this;
      _this.children.push(child);
      _this.$el.append(child.$el);
      child._added();
    };

    /**
     * removes a child container from the current one
     * calls removed and removedFromStage event and unsets stage and parent property
     *
     * @method removeChild
     * @param {Container} child the container that should be removed
     **/
    _this.removeChild = function(child){
      if (! (child && child.$el)) {
        throw new Error('removeChild expects child to be a container');
      }

      var index = _this.getChildIndex(child);

      if (index >= 0) {
        var removedChild = _this.removeChildAt(index);

        if (removedChild) {
          return removedChild;
        }
      }

      console.warn('child was not found');

      return false;
    };

    /**
     * finds stage if it's already present on child container
     *
     * @method getStage
     **/
    _this.getStage = function(){
      var stage = _this.$el.parents('body');

      if (stage.size() > 0) {
        return stage;
      }

      return false;
    };

    /**
     * paints current transformations to css style via cached dom element
     *
     * @method paint
     **/
    _this.paint = function(){
      // if container was not already painted from a function call outside -> paint again
      // saves performance by not letting container be painted twice on one rendered frame
      if (! _this.painted) {
        _painted = true;

        var transform = 'translate3d(' + _this.x + 'px,' + _this.y + 'px,' + _this.z + 'px)';
        transform += ' scale(' + _this.scaleX + ', ' + _this.scaleY + ')';
        transform += ' rotateX(' + _this.rotationX + 'deg)';
        transform += ' rotateY(' + _this.rotationY + 'deg)';
        transform += ' rotateZ(' + (_this.rotationZ + _this.rotation) + 'deg)';

        _this.el.style[css3.transformStylePrefix] = transform;
      }
    };

    /**
     * automatically assigns name of child to parent container
     * automatically creates a list of childs if there was more than one child with the same name (i.e. <li> elements)
     * dispatches added event and checks for stage
     *
     * @method _added
     * @protected
     **/
    _this._added = function(){
      // if container has a name and a parent container
      if (_this.name && _this.parent) {
        // if the name is an unused property in parent container
        if (! _this.parent[_this.name]) {
          // assing container to parent by using container's name
          _this.parent[_this.name] = _this;
          _this.parent.dynamicChildren[_this.name] = _this;
        } else {
          // if name was already set in parent container, but was actually not a reserved name,
          // but an already dynamically added child (i.e. if it was a child list <li> or similar)
          if (_this.parent.dynamicChildren[_this.name]) {
            // convert property to an array and re-assign children correctly
            var oldChild = _this.parent.dynamicChildren[_this.name];

            if (! ArrayUtils.isArray(_this.parent.dynamicChildren[_this.name])) {
              _this.parent.dynamicChildren[_this.name] = [];
              _this.parent.dynamicChildren[_this.name].push(oldChild);

              _this.parent[_this.name] = [];
              _this.parent[_this.name].push(oldChild);
            }

            _this.parent.dynamicChildren[_this.name].push(_this);
            _this.parent[_this.name].push(_this);
          } else {
            // if the added child was already assigned manually to the parent container it's ok
            // i.e. via: Main.navigation = new Navigation()
            // and navigation template defines data-name="navigation"
            if (_this.parent[_this.name] !== _this) {
              // container name was a reserved property -> not allowed
              throw new Error('child name  > ' + _this.name + ' <  is a reserved name in  > ' + _this.parent.Class.name + ' <');
            }
          }
        }
      }

      _this._checkAddedToStage();
      _this.dispatchEvent(new createjs.Event('added', false));
    };

    /**
     * automatically unsets name of child in parent container
     * automatically uncreates array list if only one more child with that name was found in parent container
     * dispatches removed event and removedFromStage event
     *
     * @method _removed
     * @protected
     **/
    _this._removed = function() {
      // first dispatch removed event, then unbind parent (we could use parent in callback)
      _this.dispatchEvent(new createjs.Event('removed', false));

      // if container had a name and a parent
      if (_this.name && _this.parent) {
        // assume the property doesn't need to be deleted
        var deletesProperty = false;

        // if the parent container really had the child's name assigned
        if (_this.parent[_this.name]) {
          // if child had siblings / if child's name was a list in parent container
          if (ArrayUtils.isArray(_this.parent[_this.name])) {
            // remove child from array list. TODO: could use createjs.indexOf ?
            for (var i = 0, _len = _this.parent[_this.name].length; i < _len; i++) {
              if (_this.parent[_this.name][i] === _this) {
                _this.parent[_this.name].splice(i, 1);
                _this.parent.dynamicChildren[_this.name].splice(i, 1);
                break;
              }
            }

            // if child list only contains one more item
            if (_this.parent[_this.name].length === 1) {
              // convert array to a simple assignemt of remaining child
              _this.parent[_this.name] = _this.parent[_this.name][0];
              _this.parent.dynamicChildren[_this.name] = _this.parent.dynamicChildren[_this.name][0];
            } else if (_this.parent[_this.name].length === 0) {
              // or if it was the only left child -> delete property
              deletesProperty = true;
            }
          } else {
            // or if it was not an array list of childs -> delete property
            deletesProperty = true;
          }

          if (deletesProperty) {
            delete _this.parent[_this.name];
            delete _this.parent.dynamicChildren[_this.name];
          }
        }
      }

      _this.parent = null;

      _this._childrenRemovedStage();
    };

    /**
     * explicitly dispatches removedFromStage events in all child containers
     * NOTE: when calling container.removeChild(child) child containers of child only dispatch removedFromStage, not removed
     *
     * @method _childrenRemovedStage
     * @protected
     **/
    _this._childrenRemovedStage = function(){
      if (_this.children) {
        var kids = _this.children;
        for (var i = 0, _len = kids.length; i < _len; i++) {
          if (kids[i]._childrenRemovedStage) {
            kids[i]._childrenRemovedStage();
          }
        }
      }

      _this.dispatchEvent(new createjs.Event('removedFromStage', false));
      _this.stage = null;
    };

    /**
     * checks if child was already added to stage
     * if so: dispatch event in child and all sub-children
     *
     * @method _checkAddedToStage
     * @protected
     **/
    _this._checkAddedToStage = function(){
      var stage = _this.getStage();
      var dispatchAddedToStage = false;

      if (stage) {
        if (! _this.stage) {
          _this.stage = stage;
          dispatchAddedToStage = true;
        }
      }

      if (_this.children) {
        var kids = _this.children;
        for (var i = 0, _len = kids.length; i < _len; i++) {
          if (kids[i]._checkAddedToStage) {
            kids[i]._checkAddedToStage();
          }
        }
      }

      if (dispatchAddedToStage) {
        _this.dispatchEvent(new createjs.Event('addedToStage', false));
      }
    };

    /**
     * checks whether the container needs to be auto updated or autoPainted on each frame
     * function gets called automatically when added or when setAutoPaint or setAutoUpdate is called
     *
     * @method _checkRendering
     * @private
     **/
    var _checkRendering = function(){
      fps.removeEventListener('tick', _update);

      if (_this.autoUpdate || _this.autoPaint) {
        fps.addEventListener('tick', _update);
      }
    };

    /**
     * checks if element needs to autoUpdate or autoPaint
     * listens to removed event to dispose rendering
     * unbinds added event as container should not be added again before removed first
     *
     * @method _render
     * @private
     **/
    var _render = function(){
      // NOTE: unused overhead? render should be called by compontent class?
      if (_this.render) _this.render();
      _this.off('added', _render, _this);
      _this.off('removed', _dispose, _this);
      _this.on('removed', _dispose, _this);
      _checkRendering();
    };

    /**
     * unbinds fps tick event and re-listens for added event to render again
     *
     * @method _dispose
     * @private
     **/
    var _dispose = function(){
      // NOTE: unused overhead? dispose should be called by compontent class?
      if (_this.dispose) _this.dispose();
      _this.off('removed', _dispose, _this);
      _this.off('added', _render, _this);
      _this.on('added', _render, _this);
      fps.removeEventListener('tick', _update);
    };

    /**
     * delegates calculation and rendering updates to child classes
     * if it should autoPaint paints transformations to css
     *
     * @method _update
     * @private
     **/
    var _update = function(e){
      // set painted to false as it should re-paint on this frame tick
      _painted = false;

      // delegate update to child classes
      _this.dispatchEvent(e);

      // autopaint transformations if needed
      if (_this.autoPaint) {
        _this.paint();
      }
    };

    Init();
  });
});
