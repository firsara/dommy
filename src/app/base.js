/*
 * base.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * requires basic dependencies and sets basic configuration
 */
define([
  'require',
  'jquery',
  'handlebars',
  'templating',
  'gsap',
  'utils/css3',
  'utils/console',
  'utils/touchmouse',
  'utils/fastclick'
], function(require) {

  var base = {};

  // attach fastclick to body
  var FastClick = require('utils/fastclick');
  FastClick.attach(document.body);

  // prevent all mouse movements by default (i.e. prevent scrolling on iOS)
  document.addEventListener('touchmove', function(event) {
    event.preventDefault();
  });

  // TODO: lay out base.isTouch to config?

  // touch events, modernizr, pointer events
  base.isTouch = ('ontouchstart' in window) ||
                 (window.Modernizr && window.Modernizr.touch) ||
                 (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 2;

  // add class to body depending on touch support
  $('body').addClass(base.isTouch ? 'touch' : 'no-touch');

  return base;
});
