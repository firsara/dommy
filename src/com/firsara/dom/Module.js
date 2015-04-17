/*
 * Module.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * A module is a set of components
 * with a separate controller and view instance
 */
define([
  'sys'
], function(
  sys
) {
  var Parent = null;

  return sys.Class({
    __extends: Parent
  },
  function Module(){
    // instance
    var _this = this;
    _this.controller = null;
    _this.container = null;

    _this.hide = function(){
      // TODO!
    };

    _this.show = function(){
      // TODO!
    };
  });
});
