(function(global) {

  var ArrayUtils = {};

  ArrayUtils.isArray = ('isArray' in Array) ?
    Array.isArray :
      function (value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }

  ArrayUtils.sortByKey = function(array, key) {
    return array.sort(function(a, b) {
      var x = a[key]; var y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  };


  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function(){
      return ArrayUtils;
    });
  } else {
    global.sys = ArrayUtils;
  }

})(this);
