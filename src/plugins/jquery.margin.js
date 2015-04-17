/*
 * jQuery.fn.margin
 * Fabian Irsara
 * Copyright 2015, Licensed GPL & MIT
 *
 * lets jquery calculate all outer margins
 * returns an object containing all the information
 *
 * example:
 * $('.element').margin().left;
 */
jQuery.fn.margin = function(){

  var self = jQuery(this);
  var data = {};

  try {
    data.left = parseFloat(self.css('margin-left').replace('px', ''));
    data.top = parseFloat(self.css('margin-top').replace('px', ''));
    data.right = parseFloat(self.css('margin-right').replace('px', ''));
    data.bottom = parseFloat(self.css('margin-bottom').replace('px', ''));
  } catch(e) {
    data = {left: 0, top: 0, right: 0, bottom: 0};
  }

  return data;
};
