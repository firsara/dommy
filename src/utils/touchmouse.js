define(['jquery'], function($) {

  /* == GLOBAL DECLERATIONS == */
  var TouchMouseEvent = {
    DOWN: 'touchmousedown',
    UP: 'touchmouseup',
    MOVE: 'touchmousemove'
  };

  var trackedTouches = [];

  /* == EVENT LISTENERS == */
  var onMouseEvent = function(event) {
    var type;

    switch (event.type) {
      case 'mousedown': type = TouchMouseEvent.DOWN; break;
      case 'mouseup':   type = TouchMouseEvent.UP;   break;
      case 'mousemove': type = TouchMouseEvent.MOVE; break;
      default:
        return;
    }

    var touchMouseEvent = normalizeEvent(type, event, event.pageX, event.pageY, -1);
    $(event.target).trigger(touchMouseEvent);
  };

  var onTouchEvent = function(event) {
    var type, i, _len, target, touch, touches;

    switch (event.type) {
      case 'touchstart':  type = TouchMouseEvent.DOWN; break;
      case 'touchend':    type = TouchMouseEvent.UP;   break;
      case 'touchcancel': type = TouchMouseEvent.UP;   break;
      case 'touchmove':   type = TouchMouseEvent.MOVE; break;
      default:
        return;
    }

    switch (type) {
      case TouchMouseEvent.DOWN:
        touches = event.changedTouches;
        for (i = 0, _len = touches.length; i < _len; i++) {
          touch = touches[i];
          touchMouseEvent = normalizeEvent(type, event, touch.pageX, touch.pageY, touch.identifier);

          target = document.elementFromPoint(touch.pageX, touch.pageY);
          trackedTouches[touch.identifier] = {target: target};
          $(target).trigger(touchMouseEvent);
        }
      break;
      case TouchMouseEvent.UP:
        touches = event.changedTouches;
        for (i = 0, _len = touches.length; i < _len; i++) {
          touch = touches[i];
          touchMouseEvent = normalizeEvent(type, event, null, null, touch.identifier);

          //target = document.elementFromPoint(touch.pageX, touch.pageY);

          //if (! target) {
          //    target = trackedTouches[touch.identifier].target;
          //}
          if (trackedTouches[touch.identifier]) {
              target = trackedTouches[touch.identifier].target;
          } else {
              target = document.elementFromPoint(touch.pageX, touch.pageY);
          }

          $(target).trigger(touchMouseEvent);

          delete trackedTouches[touch.identifier];
        }
      break;
      case TouchMouseEvent.MOVE:
        touches = event.changedTouches;
        for (i = 0, _len = touches.length; i < _len; i++) {
          touch = touches[i];
          touchMouseEvent = normalizeEvent(type, event, touch.pageX, touch.pageY, touch.identifier);

          if (trackedTouches[touch.identifier]) {
              target = trackedTouches[touch.identifier].target;
          } else {
              target = document.elementFromPoint(touch.pageX, touch.pageY);
          }
          //target = document.elementFromPoint(touch.pageX, touch.pageY);
          $(target).trigger(touchMouseEvent);
        }
      break;
    }
  };

  /* == NORMALIZE == */
  var normalizeEvent = function(type, original, x, y, pointerID) {
    return $.Event(type, {
      pageX: x,
      pageY: y,
      originalEvent: original,
      pointerID: pointerID
    });
  };

  /* == LISTEN TO ORIGINAL EVENT == */
  if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch) || window.DEBUG) {
    window.addEventListener('touchstart', onTouchEvent);
    window.addEventListener('touchmove', onTouchEvent);
    window.addEventListener('touchend', onTouchEvent);
    window.addEventListener('touchcancel', onTouchEvent);
  } else {
    window.addEventListener('mousedown', onMouseEvent);
    window.addEventListener('mouseup', onMouseEvent);
    window.addEventListener('mousemove', onMouseEvent);
  }

});
