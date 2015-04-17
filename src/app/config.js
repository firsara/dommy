/*
 * config.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * sets application configuration based on environment
 */
define(function() {
  var config = {};

  if (!!window.nodeRequire) {
    config.environment = 'nwjs';
  } else if (!!window.cordova) {
    // TODO: test if this is working
    config.environment = 'phonegap';
  } else {
    config.environment = 'browser';
  }

  return config;
});
