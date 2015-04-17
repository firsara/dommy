requirejs.config({
  baseUrl: 'app',
  urlArgs: 'bust=' +  (new Date()).getTime()
});

// require all configurations
define([
  '../require.config',
  '../com/firsara/config',
  '../require.packages'
],
function(){
  // require basic setup, config and dependencies
  require([
    'require',
    'base',
    'config',
    'Main'
  ],
  function(require) {
    // initialize main application
    // Main needs to be a child class of "dom/Container"
    var Main = require('Main');
    Main.instance = new Main();

    $('body').addChild(Main.instance);
  });
});