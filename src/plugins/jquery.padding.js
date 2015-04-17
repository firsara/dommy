/*
 * jQuery.fn.padding
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * lets jquery calculate all outer paddings
 * returns an object containing all the information
 *
 * example:
 * $('.element').padding().left;
 */
jQuery.fn.padding = function(){

  var self = jQuery(this);
  var data = {};

  try {
    data.left = parseFloat(self.css('padding-left').replace('px', ''));
    data.top = parseFloat(self.css('padding-top').replace('px', ''));
    data.right = parseFloat(self.css('padding-right').replace('px', ''));
    data.bottom = parseFloat(self.css('padding-bottom').replace('px', ''));
  } catch(e) {
    data = {left: 0, top: 0, right: 0, bottom: 0};
  }

  return data;
};
