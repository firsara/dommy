/*
 * sys.js
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * base helper scripts for creating classes, exporting packages to a different namespace (i.e. global)
 */
(function(global){
  var exports = {};

  /*
   * extends one class with an other
   * usually not used, classes get created by using sys.Class
   * See node.js implementation: https://github.com/joyent/node/blob/master/lib/util.js
   *
   * example:
   * function Vehicle(){};
   * function Car(){};
   * sys.inherits(Car, Vehicle);
   *
   * @method inherits
   * @param {function} ctor child class
   * @param {function} superCtor parent class to inherit from
   */
  exports.inherits = function(ctor, superCtor){
    var store = ctor.prototype;

    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });

    for (var k in store) {
      if (store.hasOwnProperty(k)) {
        ctor.prototype[k] = store[k];
      }
    }
  };

  /*
   * defines a package, starting at the global namespace
   *
   * example:
   * sys.setPackage('com.firsara.utils');
   *
   * would be the same as calling
   * var com = {};
   * com.firsara = {};
   * com.firsara.utils = {};
   *
   * @method setPackage
   * @param {String} pkg desired package
   */
  exports.setPackage = function(pkg){
    var elements = pkg.split('.');
    var scope = global;

    for (var i = 0; i < elements.length; i++) {
      if (! scope[elements[i]]) scope[elements[i]] = {};
      scope = scope[elements[i]];
    }

    return scope;
  };

  /*
   * defines a package, starting at the global namespace
   * useful when combining definition with sys.Class
   * useful when using the global namespace
   *
   * example:
   * function MyAwesomePredefinedClass(){}
   * sys.newClass('com.firsara.utils', 'ArrayUtils', MyAwesomePredefinedClass);
   *
   * would be the same as calling
   * var com = {};
   * com.firsara = {};
   * com.firsara.utils = {};
   *
   * @method newClass
   * @param {String} pkg desired package
   * @param {String} className desired name of class
   * @param {object|function} definition that should be stored
   */
  exports.newClass = function(pkg, className, definition){
    var scope = this.setPackage(pkg);
    scope[className] = definition;
  };

  /*
   * creates a new Class with an optional defined parent
   * useful when not using the global namespace at all (i.e. through requirejs)
   *
   * example:
   * var Car = sys.Class({
   *   __extends: Vehicle
   * },
   * function Car(){
   *   // constructor
   * });
   *
   * @method Class
   * @param {object} options defined class options
   * @param {function} definition that should be stored
   */
  exports.Class = function(options, definition){
    var parentCtor = options.__extends;

    definition.prototype = {};
    definition.prototype.Class = definition;

    if (parentCtor) this.inherits(definition, parentCtor);

    return definition;
  };

  /*
   * exports packages to the global or a defined namespace
   *
   * example:
   * com.firsara.utils.ArrayUtils = 'utils';
   * sys.exportPackage(window, com.firsara.utils);
   * console.log(ArrayUtils); // prints 'utils'
   *
   * com.firsara.utils.UtilOne = 'one';
   * com.firsara.utils.UtilTwo = 'two';
   * com.firsara.utils.NotUtil = 'not';
   * var myImports = {};
   * sys.exportPackage(myImports, com.firsara.utils, 'Util');
   * console.log(myImports); // prints 'one' and 'two'
   *
   * @method exportPackage
   * @param {object} exportTo which namespace it should be exported to
   * @param {object} pkg the package or class that should be exported
   * @param {String} startsWith only export definitions in pkg that start with x
   */
  exports.exportPackage = function(exportTo, pkg, startsWith){
    for (var k in pkg) {
      if (typeof pkg[k] === 'object') {
        this.exportPackage(pkg[k], startsWith);
      } else {
        if (k.indexOf(startsWith) >= 0 || (! startsWith)) {
          exportTo[k] = pkg[k];
        }
      }
    }
  };

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['es5-shim'], exports);
  } else {
    global.sys = exports;
  }
})(this);
