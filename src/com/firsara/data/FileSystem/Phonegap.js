define([
  'sys',
  'data/FileSystem/Base'
], function(
  sys,
  Parent
) {
  return sys.Class({
    __extends: Parent
  },
  function FileSystemPhonegap(){
    var _this = this;

    Parent.call(this);

    _this.getLocalFiles = function(){
    };
  });
});
