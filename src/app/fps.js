/*
 * fps.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * FPSHandler singleton instance
 * not more than one FPSHandler should be needed in one Application
 */
define(['com/firsara/utils/FPSHandler'], function(FPSHandler) {
  var fps = new FPSHandler();
  return fps;
});
