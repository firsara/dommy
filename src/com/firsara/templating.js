/*
 * templating.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * templating helper scripts
 * used for bootstrapping "dom/Container" creation
 * includes handlebars helpers
 */
define(['jquery', 'handlebars'], function($, Handlebars) {

  /*
   * used by "dom/Container" to simplify appending dom elements
   *
   * @plugin addChild
   */
  $.fn.addChild = function(child){
    if (child && child.$el) {
      $(this).append(child.$el);
      child._added();
    }
  };

  /*
   * used by "dom/Container" to simplify removing dom elements
   *
   * @plugin removeChild
   */
  $.fn.removeChild = function(child){
    if (child && child.$el && child.$el.remove) {
      child.$el.remove();
      child._removed();
    }
  };

  /*
   * helper function to create a "dom/Container" out of a simple jQuery element
   *
   * @plugin container
   */
  $.fn.container = function(){
    var Container = require('dom/Container');
    return Container.fetch($(this));
  };

  /*
   * alternative to $.fn.bind
   *
   * @plugin addEventListener
   */
  $.fn.addEventListener = function(evt, fct){
    $(this).bind(evt, fct);
  };

  /*
   * alternative to $.fn.unbind
   *
   * @plugin removeEventListener
   */
  $.fn.removeEventListener = function(evt, fct){
    $(this).unbind(evt, fct);
  };


  /*
   * increments the given value by 1.
   * used for outputting a numeric list in an each loop
   * usage: {{inc @index}}
   *
   * @helper inc
   */
  Handlebars.registerHelper('inc', function(value, options){
    return parseInt(value) + 1;
  });

  /*
   * increments the given value by 1, only if the key is numeric.
   * used for outputting a numeric list in an each loop for arrays, not objects
   * usage: {{inc_key @key}}
   *
   * example:
   * persons = {
   *   first: {
   *     children: [
   *       {},
   *       {}
   *     ]
   *   },
   *   second: {},
   * }
   * {{#each persons}}
   *   {{inc_key @key}} // outputs 'first', 'second'
   *   {{#each children}}
   *     {{inc_key @key}} // outputs '1', '2'
   *   {{/each}}
   * {{/each}}
   *
   * @helper inc_key
   */
  Handlebars.registerHelper('inc_key', function(value, options){
    if (isNaN(value)) return value;
    return parseInt(value) + 1;
  });

  /*
   * Logs given value through window console
   * usage: {{console_log @key}}
   *
   * @helper console_log
   */
  Handlebars.registerHelper('console_log', function(value, options){
    console.log(value);
  });

});
