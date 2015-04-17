/*
 * config.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * basic bootstrapping configuration for requirejs
 */
requirejs.config({
  paths: {
    app: '../app',
    utils: '../utils',
    plugins: '../plugins',

    com: '../com',

    Component: '../com/firsara/dom/Component',
    TransformableComponent: '../com/firsara/dom/TransformableComponent',
    Module: '../com/firsara/dom/Module',
    Template: 'modules/Template',

    sys: '../com/firsara/sys',
    templating: '../com/firsara/templating',
    dom: '../com/firsara/dom',
    data: '../com/firsara/data',

    // NOTE: workaround for hbs template compiler
    // uses "handlebars-compiler" which is actually Handlebars itself
    'handlebars-compiler': '../com/firsara/handlebars-compiler'
  }
});

// require base classes that can be used in templates via data-class
define([
  'dom/Container',
  'dom/Transformable',
  'dom/MoveClip',
  'dom/RotateClip',
  'dom/ScaleClip',
  'dom/TransformClip'
], {});
