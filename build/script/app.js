'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.4';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function rtl() {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function plugin(_plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(_plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = _plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function registerPlugin(plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function unregisterPlugin(plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function reInit(plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins === 'undefined' ? 'undefined' : _typeof(plugins),
              _this = this,
              fns = {
            'object': function object(plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function string() {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function undefined() {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function GetYoDigits(length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function reflow(elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function transitionend($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function throttle(func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function foundation(method) {
    var type = typeof method === 'undefined' ? 'undefined' : _typeof(method),
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function now() {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function fNOP() {},
          fBound = function fBound() {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets

    /**
     * Compares the dimensions of an element to a container and determines collision events with container.
     * @function
     * @param {jQuery} element - jQuery object to test for collisions.
     * @param {jQuery} parent - jQuery object to use as bounding container.
     * @param {Boolean} lrOnly - set to true to check left and right values only.
     * @param {Boolean} tbOnly - set to true to check top and bottom values only.
     * @default if no parent object passed, detects collisions with `window`.
     * @returns {Boolean} - true if collision free, false if a collision in any direction.
     */
  };function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left + hOffset,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function parseKey(event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;
      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function handleKey(event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
        // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        var returnValue = fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled(returnValue);
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function findFocusable($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function register(componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function _init() {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        if (namedQueries.hasOwnProperty(key)) {
          self.queries.push({
            name: key,
            value: 'only screen and (min-width: ' + namedQueries[key] + ')'
          });
        }
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function atLeast(size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function get(size) {
      for (var i in this.queries) {
        if (this.queries.hasOwnProperty(i)) {
          var query = this.queries[i];
          if (size === query.name) return query.value;
        }
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function _getCurrentSize() {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function _watcher() {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize(),
            currentSize = _this.current;

        if (newSize !== currentSize) {
          // Change the current media query
          _this.current = newSize;

          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script && script.parentNode && script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function matchMedium(media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function animateIn(element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function animateOut(element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  var Nest = {
    Feather: function Feather(menu) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function Burn(menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('>li, .menu, .menu > li').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        if (cb && typeof cb === 'function') {
          cb();
        }
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;'use strict';

//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function setup() {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function handleTouch(event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function triggers(el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).on('load', function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Abide module.
   * @module foundation.abide
   */

  var Abide = function () {
    /**
     * Creates a new instance of Abide.
     * @class
     * @fires Abide#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Abide(element) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Abide);

      this.$element = element;
      this.options = $.extend({}, Abide.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Abide');
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */


    _createClass(Abide, [{
      key: '_init',
      value: function _init() {
        this.$inputs = this.$element.find('input, textarea, select');

        this._events();
      }

      /**
       * Initializes events for Abide.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        this.$element.off('.abide').on('reset.zf.abide', function () {
          _this2.resetForm();
        }).on('submit.zf.abide', function () {
          return _this2.validateForm();
        });

        if (this.options.validateOn === 'fieldChange') {
          this.$inputs.off('change.zf.abide').on('change.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }

        if (this.options.liveValidate) {
          this.$inputs.off('input.zf.abide').on('input.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }
      }

      /**
       * Calls necessary functions to update Abide upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        this._init();
      }

      /**
       * Checks whether or not a form element has the required attribute and if it's checked or not
       * @param {Object} element - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'requiredCheck',
      value: function requiredCheck($el) {
        if (!$el.attr('required')) return true;

        var isGood = true;

        switch ($el[0].type) {
          case 'checkbox':
            isGood = $el[0].checked;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            var opt = $el.find('option:selected');
            if (!opt.length || !opt.val()) isGood = false;
            break;

          default:
            if (!$el.val() || !$el.val().length) isGood = false;
        }

        return isGood;
      }

      /**
       * Based on $el, get the first element with selector in this order:
       * 1. The element's direct sibling('s).
       * 3. The element's parent's children.
       *
       * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
       *
       * @param {Object} $el - jQuery object to use as reference to find the form error selector.
       * @returns {Object} jQuery object with the selector.
       */

    }, {
      key: 'findFormError',
      value: function findFormError($el) {
        var $error = $el.siblings(this.options.formErrorSelector);

        if (!$error.length) {
          $error = $el.parent().find(this.options.formErrorSelector);
        }

        return $error;
      }

      /**
       * Get the first element in this order:
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findLabel',
      value: function findLabel($el) {
        var id = $el[0].id;
        var $label = this.$element.find('label[for="' + id + '"]');

        if (!$label.length) {
          return $el.closest('label');
        }

        return $label;
      }

      /**
       * Get the set of labels associated with a set of radio els in this order
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findRadioLabels',
      value: function findRadioLabels($els) {
        var _this3 = this;

        var labels = $els.map(function (i, el) {
          var id = el.id;
          var $label = _this3.$element.find('label[for="' + id + '"]');

          if (!$label.length) {
            $label = $(el).closest('label');
          }
          return $label[0];
        });

        return $(labels);
      }

      /**
       * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
       * @param {Object} $el - jQuery object to add the class to
       */

    }, {
      key: 'addErrorClasses',
      value: function addErrorClasses($el) {
        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.addClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.addClass(this.options.formErrorClass);
        }

        $el.addClass(this.options.inputErrorClass).attr('data-invalid', '');
      }

      /**
       * Remove CSS error classes etc from an entire radio button group
       * @param {String} groupName - A string that specifies the name of a radio button group
       *
       */

    }, {
      key: 'removeRadioErrorClasses',
      value: function removeRadioErrorClasses(groupName) {
        var $els = this.$element.find(':radio[name="' + groupName + '"]');
        var $labels = this.findRadioLabels($els);
        var $formErrors = this.findFormError($els);

        if ($labels.length) {
          $labels.removeClass(this.options.labelErrorClass);
        }

        if ($formErrors.length) {
          $formErrors.removeClass(this.options.formErrorClass);
        }

        $els.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Removes CSS error class as specified by the Abide settings from the label, input, and the form
       * @param {Object} $el - jQuery object to remove the class from
       */

    }, {
      key: 'removeErrorClasses',
      value: function removeErrorClasses($el) {
        // radios need to clear all of the els
        if ($el[0].type == 'radio') {
          return this.removeRadioErrorClasses($el.attr('name'));
        }

        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.removeClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.removeClass(this.options.formErrorClass);
        }

        $el.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Goes through a form to find inputs and proceeds to validate them in ways specific to their type
       * @fires Abide#invalid
       * @fires Abide#valid
       * @param {Object} element - jQuery object to validate, should be an HTML input
       * @returns {Boolean} goodToGo - If the input is valid or not.
       */

    }, {
      key: 'validateInput',
      value: function validateInput($el) {
        var clearRequire = this.requiredCheck($el),
            validated = false,
            customValidator = true,
            validator = $el.attr('data-validator'),
            equalTo = true;

        // don't validate ignored inputs or hidden inputs
        if ($el.is('[data-abide-ignore]') || $el.is('[type="hidden"]')) {
          return true;
        }

        switch ($el[0].type) {
          case 'radio':
            validated = this.validateRadio($el.attr('name'));
            break;

          case 'checkbox':
            validated = clearRequire;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            validated = clearRequire;
            break;

          default:
            validated = this.validateText($el);
        }

        if (validator) {
          customValidator = this.matchValidation($el, validator, $el.attr('required'));
        }

        if ($el.attr('data-equalto')) {
          equalTo = this.options.validators.equalTo($el);
        }

        var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
        var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

        this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

        /**
         * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
         * Trigger includes the DOM element of the input.
         * @event Abide#valid
         * @event Abide#invalid
         */
        $el.trigger(message, [$el]);

        return goodToGo;
      }

      /**
       * Goes through a form and if there are any invalid inputs, it will display the form error element
       * @returns {Boolean} noError - true if no errors were detected...
       * @fires Abide#formvalid
       * @fires Abide#forminvalid
       */

    }, {
      key: 'validateForm',
      value: function validateForm() {
        var acc = [];
        var _this = this;

        this.$inputs.each(function () {
          acc.push(_this.validateInput($(this)));
        });

        var noError = acc.indexOf(false) === -1;

        this.$element.find('[data-abide-error]').css('display', noError ? 'none' : 'block');

        /**
         * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
         * Trigger includes the element of the form.
         * @event Abide#formvalid
         * @event Abide#forminvalid
         */
        this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

        return noError;
      }

      /**
       * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
       * @param {Object} $el - jQuery object to validate, should be a text input HTML element
       * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
       * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
       */

    }, {
      key: 'validateText',
      value: function validateText($el, pattern) {
        // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
        pattern = pattern || $el.attr('pattern') || $el.attr('type');
        var inputText = $el.val();
        var valid = false;

        if (inputText.length) {
          // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
          if (this.options.patterns.hasOwnProperty(pattern)) {
            valid = this.options.patterns[pattern].test(inputText);
          }
          // If the pattern name isn't also the type attribute of the field, then test it as a regexp
          else if (pattern !== $el.attr('type')) {
              valid = new RegExp(pattern).test(inputText);
            } else {
              valid = true;
            }
        }
        // An empty field is valid if it's not required
        else if (!$el.prop('required')) {
            valid = true;
          }

        return valid;
      }

      /**
       * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
       * @param {String} groupName - A string that specifies the name of a radio button group
       * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
       */

    }, {
      key: 'validateRadio',
      value: function validateRadio(groupName) {
        // If at least one radio in the group has the `required` attribute, the group is considered required
        // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
        var $group = this.$element.find(':radio[name="' + groupName + '"]');
        var valid = false,
            required = false;

        // For the group to be required, at least one radio needs to be required
        $group.each(function (i, e) {
          if ($(e).attr('required')) {
            required = true;
          }
        });
        if (!required) valid = true;

        if (!valid) {
          // For the group to be valid, at least one radio needs to be checked
          $group.each(function (i, e) {
            if ($(e).prop('checked')) {
              valid = true;
            }
          });
        };

        return valid;
      }

      /**
       * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
       * @param {Object} $el - jQuery input element.
       * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
       * @param {Boolean} required - self explanatory?
       * @returns {Boolean} - true if validations passed.
       */

    }, {
      key: 'matchValidation',
      value: function matchValidation($el, validators, required) {
        var _this4 = this;

        required = required ? true : false;

        var clear = validators.split(' ').map(function (v) {
          return _this4.options.validators[v]($el, required, $el.parent());
        });
        return clear.indexOf(false) === -1;
      }

      /**
       * Resets form inputs and styles
       * @fires Abide#formreset
       */

    }, {
      key: 'resetForm',
      value: function resetForm() {
        var $form = this.$element,
            opts = this.options;

        $('.' + opts.labelErrorClass, $form).not('small').removeClass(opts.labelErrorClass);
        $('.' + opts.inputErrorClass, $form).not('small').removeClass(opts.inputErrorClass);
        $(opts.formErrorSelector + '.' + opts.formErrorClass).removeClass(opts.formErrorClass);
        $form.find('[data-abide-error]').css('display', 'none');
        $(':input', $form).not(':button, :submit, :reset, :hidden, :radio, :checkbox, [data-abide-ignore]').val('').removeAttr('data-invalid');
        $(':input:radio', $form).not('[data-abide-ignore]').prop('checked', false).removeAttr('data-invalid');
        $(':input:checkbox', $form).not('[data-abide-ignore]').prop('checked', false).removeAttr('data-invalid');
        /**
         * Fires when the form has been reset.
         * @event Abide#formreset
         */
        $form.trigger('formreset.zf.abide', [$form]);
      }

      /**
       * Destroys an instance of Abide.
       * Removes error styles and classes from elements, without resetting their values.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        var _this = this;
        this.$element.off('.abide').find('[data-abide-error]').css('display', 'none');

        this.$inputs.off('.abide').each(function () {
          _this.removeErrorClasses($(this));
        });

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Abide;
  }();

  /**
   * Default settings for plugin
   */


  Abide.defaults = {
    /**
     * The default event to validate inputs. Checkboxes and radios validate immediately.
     * Remove or change this value for manual validation.
     * @option
     * @example 'fieldChange'
     */
    validateOn: 'fieldChange',

    /**
     * Class to be applied to input labels on failed validation.
     * @option
     * @example 'is-invalid-label'
     */
    labelErrorClass: 'is-invalid-label',

    /**
     * Class to be applied to inputs on failed validation.
     * @option
     * @example 'is-invalid-input'
     */
    inputErrorClass: 'is-invalid-input',

    /**
     * Class selector to use to target Form Errors for show/hide.
     * @option
     * @example '.form-error'
     */
    formErrorSelector: '.form-error',

    /**
     * Class added to Form Errors on failed validation.
     * @option
     * @example 'is-visible'
     */
    formErrorClass: 'is-visible',

    /**
     * Set to true to validate text inputs on any value change.
     * @option
     * @example false
     */
    liveValidate: false,

    patterns: {
      alpha: /^[a-zA-Z]+$/,
      alpha_numeric: /^[a-zA-Z0-9]+$/,
      integer: /^[-+]?\d+$/,
      number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv: /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
      equalTo: function equalTo(el, required, parent) {
        return $('#' + el.attr('data-equalto')).val() === el.val();
      }
    }

    // Window exports
  };Foundation.plugin(Abide, 'Abide');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Dropdown = function () {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Dropdown(element, options) {
      _classCallCheck(this, Dropdown);

      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */


    _createClass(Dropdown, [{
      key: '_init',
      value: function _init() {
        var $id = this.$element.attr('id');

        this.$anchor = $('[data-toggle="' + $id + '"]').length ? $('[data-toggle="' + $id + '"]') : $('[data-open="' + $id + '"]');
        this.$anchor.attr({
          'aria-controls': $id,
          'data-is-focus': false,
          'data-yeti-box': $id,
          'aria-haspopup': true,
          'aria-expanded': false

        });

        this.options.positionClass = this.getPositionClass();
        this.counter = 4;
        this.usedPositions = [];
        this.$element.attr({
          'aria-hidden': 'true',
          'data-yeti-box': $id,
          'data-resize': $id,
          'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
        });
        this._events();
      }

      /**
       * Helper function to determine current orientation of dropdown pane.
       * @function
       * @returns {String} position - string value of a position class.
       */

    }, {
      key: 'getPositionClass',
      value: function getPositionClass() {
        var verticalPosition = this.$element[0].className.match(/(top|left|right|bottom)/g);
        verticalPosition = verticalPosition ? verticalPosition[0] : '';
        var horizontalPosition = /float-(\S+)/.exec(this.$anchor[0].className);
        horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
        var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;

        return position;
      }

      /**
       * Adjusts the dropdown panes orientation by adding/removing positioning classes.
       * @function
       * @private
       * @param {String} position - position class to remove.
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');
        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.$element.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.$element.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.$element.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * Sets the position and orientation of the dropdown pane, checks for collisions.
       * Recursively calls itself if a collision is detected, with a new position class.
       * @function
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        if (this.$anchor.attr('aria-expanded') === 'false') {
          return false;
        }
        var position = this.getPositionClass(),
            $eleDims = Foundation.Box.GetDimensions(this.$element),
            $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
            _this = this,
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

        if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element)) {
          this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $eleDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          this.classChanged = true;
          return false;
        }

        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.$element, false, true) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * Adds event listeners to the element utilizing the triggers utility library.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': this._setPosition.bind(this)
        });

        if (this.options.hover) {
          this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            if ($('body[data-whatinput="mouse"]').is('*')) {
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function () {
                _this.open();
                _this.$anchor.data('hover', true);
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
          if (this.options.hoverPane) {
            this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
              clearTimeout(_this.timeout);
            }).on('mouseleave.zf.dropdown', function () {
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function () {
                _this.close();
                _this.$anchor.data('hover', false);
              }, _this.options.hoverDelay);
            });
          }
        }
        this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

          var $target = $(this),
              visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

          Foundation.Keyboard.handleKey(e, 'Dropdown', {
            tab_forward: function tab_forward() {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(0).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            tab_backward: function tab_backward() {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(-1).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            open: function open() {
              if ($target.is(_this.$anchor)) {
                _this.open();
                _this.$element.attr('tabindex', -1).focus();
                e.preventDefault();
              }
            },
            close: function close() {
              _this.close();
              _this.$anchor.focus();
            }
          });
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body).not(this.$element),
            _this = this;
        $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
          if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
            return;
          }
          if (_this.$element.find(e.target).length) {
            return;
          }
          _this.close();
          $body.off('click.zf.dropdown');
        });
      }

      /**
       * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
       * @function
       * @fires Dropdown#closeme
       * @fires Dropdown#show
       */

    }, {
      key: 'open',
      value: function open() {
        // var _this = this;
        /**
         * Fires to close other open dropdowns
         * @event Dropdown#closeme
         */
        this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
        this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
        // this.$element/*.show()*/;
        this._setPosition();
        this.$element.addClass('is-open').attr({ 'aria-hidden': false });

        if (this.options.autoFocus) {
          var $focusable = Foundation.Keyboard.findFocusable(this.$element);
          if ($focusable.length) {
            $focusable.eq(0).focus();
          }
        }

        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }

        /**
         * Fires once the dropdown is visible.
         * @event Dropdown#show
         */
        this.$element.trigger('show.zf.dropdown', [this.$element]);
      }

      /**
       * Closes the open dropdown pane.
       * @function
       * @fires Dropdown#hide
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.$element.hasClass('is-open')) {
          return false;
        }
        this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

        this.$anchor.removeClass('hover').attr('aria-expanded', false);

        if (this.classChanged) {
          var curPositionClass = this.getPositionClass();
          if (curPositionClass) {
            this.$element.removeClass(curPositionClass);
          }
          this.$element.addClass(this.options.positionClass)
          /*.hide()*/.css({ height: '', width: '' });
          this.classChanged = false;
          this.counter = 4;
          this.usedPositions.length = 0;
        }
        this.$element.trigger('hide.zf.dropdown', [this.$element]);
      }

      /**
       * Toggles the dropdown pane's visibility.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.$element.hasClass('is-open')) {
          if (this.$anchor.data('hover')) return;
          this.close();
        } else {
          this.open();
        }
      }

      /**
       * Destroys the dropdown.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger').hide();
        this.$anchor.off('.zf.dropdown');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Dropdown;
  }();

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false

    // Window exports
  };Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  var DropdownMenu = function () {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function DropdownMenu(element, options) {
      _classCallCheck(this, DropdownMenu);

      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */


    _createClass(DropdownMenu, [{
      key: '_init',
      value: function _init() {
        var subs = this.$element.find('li.is-dropdown-submenu-parent');
        this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

        this.$menuItems = this.$element.find('[role="menuitem"]');
        this.$tabs = this.$element.children('[role="menuitem"]');
        this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

        if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
        this.changed = false;
        this._events();
      }
    }, {
      key: '_isVertical',
      value: function _isVertical() {
        return this.$tabs.css('display') === 'block';
      }

      /**
       * Adds event listeners to elements within the menu
       * @private
       * @function
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this,
            hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
            parClass = 'is-dropdown-submenu-parent';

        // used for onClick and in the keyboard handlers
        var handleClickFn = function handleClickFn(e) {
          var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
              hasSub = $elem.hasClass(parClass),
              hasClicked = $elem.attr('data-is-click') === 'true',
              $sub = $elem.children('.is-dropdown-submenu');

          if (hasSub) {
            if (hasClicked) {
              if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                return;
              } else {
                e.stopImmediatePropagation();
                e.preventDefault();
                _this._hide($elem);
              }
            } else {
              e.preventDefault();
              e.stopImmediatePropagation();
              _this._show($sub);
              $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
            }
          } else {
            if (_this.options.closeOnClickInside) {
              _this._hide($elem);
            }
            return;
          }
        };

        if (this.options.clickOpen || hasTouch) {
          this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
        }

        if (!this.options.disableHover) {
          this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);

            if (hasSub) {
              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._show($elem.children('.is-dropdown-submenu'));
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);
            if (hasSub && _this.options.autoclose) {
              if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                return false;
              }

              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._hide($elem);
              }, _this.options.closingTime);
            }
          });
        }
        this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
          var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
              isTab = _this.$tabs.index($element) > -1,
              $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(i - 1);
              $nextElement = $elements.eq(i + 1);
              return;
            }
          });

          var nextSibling = function nextSibling() {
            if (!$element.is(':last-child')) {
              $nextElement.children('a:first').focus();
              e.preventDefault();
            }
          },
              prevSibling = function prevSibling() {
            $prevElement.children('a:first').focus();
            e.preventDefault();
          },
              openSub = function openSub() {
            var $sub = $element.children('ul.is-dropdown-submenu');
            if ($sub.length) {
              _this._show($sub);
              $element.find('li > a:first').focus();
              e.preventDefault();
            } else {
              return;
            }
          },
              closeSub = function closeSub() {
            //if ($element.is(':first-child')) {
            var close = $element.parent('ul').parent('li');
            close.children('a:first').focus();
            _this._hide(close);
            e.preventDefault();
            //}
          };
          var functions = {
            open: openSub,
            close: function close() {
              _this._hide(_this.$element);
              _this.$menuItems.find('a:first').focus(); // focus to first element
              e.preventDefault();
            },
            handled: function handled() {
              e.stopImmediatePropagation();
            }
          };

          if (isTab) {
            if (_this._isVertical()) {
              // vertical menu
              if (Foundation.rtl()) {
                // right aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: closeSub,
                  previous: openSub
                });
              } else {
                // left aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: openSub,
                  previous: closeSub
                });
              }
            } else {
              // horizontal menu
              if (Foundation.rtl()) {
                // right aligned
                $.extend(functions, {
                  next: prevSibling,
                  previous: nextSibling,
                  down: openSub,
                  up: closeSub
                });
              } else {
                // left aligned
                $.extend(functions, {
                  next: nextSibling,
                  previous: prevSibling,
                  down: openSub,
                  up: closeSub
                });
              }
            }
          } else {
            // not tabs -> one sub
            if (Foundation.rtl()) {
              // right aligned
              $.extend(functions, {
                next: closeSub,
                previous: openSub,
                down: nextSibling,
                up: prevSibling
              });
            } else {
              // left aligned
              $.extend(functions, {
                next: openSub,
                previous: closeSub,
                down: nextSibling,
                up: prevSibling
              });
            }
          }
          Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body),
            _this = this;
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $link = _this.$element.find(e.target);
          if ($link.length) {
            return;
          }

          _this._hide();
          $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
        });
      }

      /**
       * Opens a dropdown pane, and checks for collisions first.
       * @param {jQuery} $sub - ul element that is a submenu to show
       * @function
       * @private
       * @fires DropdownMenu#show
       */

    }, {
      key: '_show',
      value: function _show($sub) {
        var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
          return $(el).find($sub).length > 0;
        }));
        var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
        this._hide($sibs, idx);
        $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
        var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
              $parentLi = $sub.parent('.is-dropdown-submenu-parent');
          $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
          clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
          if (!clear) {
            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
          }
          this.changed = true;
        }
        $sub.css('visibility', '');
        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }
        /**
         * Fires when the new dropdown pane is visible.
         * @event DropdownMenu#show
         */
        this.$element.trigger('show.zf.dropdownmenu', [$sub]);
      }

      /**
       * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
       * @function
       * @param {jQuery} $elem - element with a submenu to hide
       * @param {Number} idx - index of the $tabs collection to hide
       * @private
       */

    }, {
      key: '_hide',
      value: function _hide($elem, idx) {
        var $toClose;
        if ($elem && $elem.length) {
          $toClose = $elem;
        } else if (idx !== undefined) {
          $toClose = this.$tabs.not(function (i, el) {
            return i === idx;
          });
        } else {
          $toClose = this.$element;
        }
        var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

        if (somethingToClose) {
          $toClose.find('li.is-active').add($toClose).attr({
            'aria-expanded': false,
            'data-is-click': false
          }).removeClass('is-active');

          $toClose.find('ul.js-dropdown-active').attr({
            'aria-hidden': true
          }).removeClass('js-dropdown-active');

          if (this.changed || $toClose.find('opens-inner').length) {
            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
            this.changed = false;
          }
          /**
           * Fires when the open menus are closed.
           * @event DropdownMenu#hide
           */
          this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
        }
      }

      /**
       * Destroys the plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
        $(document.body).off('.zf.dropdownmenu');
        Foundation.Nest.Burn(this.$element, 'dropdown');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return DropdownMenu;
  }();

  /**
   * Default settings for plugin
   */


  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allow clicks on leaf anchor links to close any open submenus.
     * @option
     * @example true
     */
    closeOnClickInside: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  var Interchange = function () {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Interchange(element, options) {
      _classCallCheck(this, Interchange);

      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */


    _createClass(Interchange, [{
      key: '_init',
      value: function _init() {
        this._addBreakpoints();
        this._generateRules();
        this._reflow();
      }

      /**
       * Initializes events for Interchange.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        $(window).on('resize.zf.interchange', Foundation.util.throttle(this._reflow.bind(this), 50));
      }

      /**
       * Calls necessary functions to update Interchange upon DOM change
       * @function
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        var match;

        // Iterate through each rule, but only save the last match
        for (var i in this.rules) {
          if (this.rules.hasOwnProperty(i)) {
            var rule = this.rules[i];

            if (window.matchMedia(rule.query).matches) {
              match = rule;
            }
          }
        }

        if (match) {
          this.replace(match.path);
        }
      }

      /**
       * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
       * @function
       * @private
       */

    }, {
      key: '_addBreakpoints',
      value: function _addBreakpoints() {
        for (var i in Foundation.MediaQuery.queries) {
          if (Foundation.MediaQuery.queries.hasOwnProperty(i)) {
            var query = Foundation.MediaQuery.queries[i];
            Interchange.SPECIAL_QUERIES[query.name] = query.value;
          }
        }
      }

      /**
       * Checks the Interchange element for the provided media query + content pairings
       * @function
       * @private
       * @param {Object} element - jQuery object that is an Interchange instance
       * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
       */

    }, {
      key: '_generateRules',
      value: function _generateRules(element) {
        var rulesList = [];
        var rules;

        if (this.options.rules) {
          rules = this.options.rules;
        } else {
          rules = this.$element.data('interchange').match(/\[.*?\]/g);
        }

        for (var i in rules) {
          if (rules.hasOwnProperty(i)) {
            var rule = rules[i].slice(1, -1).split(', ');
            var path = rule.slice(0, -1).join('');
            var query = rule[rule.length - 1];

            if (Interchange.SPECIAL_QUERIES[query]) {
              query = Interchange.SPECIAL_QUERIES[query];
            }

            rulesList.push({
              path: path,
              query: query
            });
          }
        }

        this.rules = rulesList;
      }

      /**
       * Update the `src` property of an image, or change the HTML of a container, to the specified path.
       * @function
       * @param {String} path - Path to the image or HTML partial.
       * @fires Interchange#replaced
       */

    }, {
      key: 'replace',
      value: function replace(path) {
        if (this.currentPath === path) return;

        var _this = this,
            trigger = 'replaced.zf.interchange';

        // Replacing images
        if (this.$element[0].nodeName === 'IMG') {
          this.$element.attr('src', path).on('load', function () {
            _this.currentPath = path;
          }).trigger(trigger);
        }
        // Replacing background images
        else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
            this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
          }
          // Replacing HTML
          else {
              $.get(path, function (response) {
                _this.$element.html(response).trigger(trigger);
                $(response).foundation();
                _this.currentPath = path;
              });
            }

        /**
         * Fires when content in an Interchange element is done being loaded.
         * @event Interchange#replaced
         */
        // this.$element.trigger('replaced.zf.interchange');
      }

      /**
       * Destroys an instance of interchange.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this.
      }
    }]);

    return Interchange;
  }();

  /**
   * Default settings for plugin
   */


  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
        if (typeof this.rules === 'string') {
          var rulesTree = {};

          // Parse rules from "classes" pulled from data attribute
          var rules = this.rules.split(' ');

          // Iterate through every rule found
          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i].split('-');
            var ruleSize = rule.length > 1 ? rule[0] : 'small';
            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

            if (MenuPlugins[rulePlugin] !== null) {
              rulesTree[ruleSize] = MenuPlugins[rulePlugin];
            }
          }

          this.rules = rulesTree;
        }

        if (!$.isEmptyObject(this.rules)) {
          this._checkMediaQueries();
        }
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]');

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this._updateMqHandler = this._update.bind(this);

        $(window).on('changed.zf.mediaquery', this._updateMqHandler);

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$targetMenu.toggle(0);

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.responsiveToggle');
        this.$toggler.off('.zf.responsiveToggle');

        $(window).off('changed.zf.mediaquery', this._updateMqHandler);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  var Reveal = function () {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */
    function Reveal(element, options) {
      _classCallCheck(this, Reveal);

      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */


    _createClass(Reveal, [{
      key: '_init',
      value: function _init() {
        this.id = this.$element.attr('id');
        this.isActive = false;
        this.cached = { mq: Foundation.MediaQuery.current };
        this.isMobile = mobileSniff();

        this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');
        this.$anchor.attr({
          'aria-controls': this.id,
          'aria-haspopup': true,
          'tabindex': 0
        });

        if (this.options.fullScreen || this.$element.hasClass('full')) {
          this.options.fullScreen = true;
          this.options.overlay = false;
        }
        if (this.options.overlay && !this.$overlay) {
          this.$overlay = this._makeOverlay(this.id);
        }

        this.$element.attr({
          'role': 'dialog',
          'aria-hidden': true,
          'data-yeti-box': this.id,
          'data-resize': this.id
        });

        if (this.$overlay) {
          this.$element.detach().appendTo(this.$overlay);
        } else {
          this.$element.detach().appendTo($('body'));
          this.$element.addClass('without-overlay');
        }
        this._events();
        if (this.options.deepLink && window.location.hash === '#' + this.id) {
          $(window).one('load.zf.reveal', this.open.bind(this));
        }
      }

      /**
       * Creates an overlay div to display behind the modal.
       * @private
       */

    }, {
      key: '_makeOverlay',
      value: function _makeOverlay(id) {
        var $overlay = $('<div></div>').addClass('reveal-overlay').appendTo('body');
        return $overlay;
      }

      /**
       * Updates position of modal
       * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
       * @private
       */

    }, {
      key: '_updatePosition',
      value: function _updatePosition() {
        var width = this.$element.outerWidth();
        var outerWidth = $(window).width();
        var height = this.$element.outerHeight();
        var outerHeight = $(window).height();
        var left, top;
        if (this.options.hOffset === 'auto') {
          left = parseInt((outerWidth - width) / 2, 10);
        } else {
          left = parseInt(this.options.hOffset, 10);
        }
        if (this.options.vOffset === 'auto') {
          if (height > outerHeight) {
            top = parseInt(Math.min(100, outerHeight / 10), 10);
          } else {
            top = parseInt((outerHeight - height) / 4, 10);
          }
        } else {
          top = parseInt(this.options.vOffset, 10);
        }
        this.$element.css({ top: top + 'px' });
        // only worry about left if we don't have an overlay or we havea  horizontal offset,
        // otherwise we're perfectly in the middle
        if (!this.$overlay || this.options.hOffset !== 'auto') {
          this.$element.css({ left: left + 'px' });
          this.$element.css({ margin: '0px' });
        }
      }

      /**
       * Adds event handlers for the modal.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        var _this = this;

        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': function closeZfTrigger(event, $element) {
            if (event.target === _this.$element[0] || $(event.target).parents('[data-closable]')[0] === $element) {
              // only close reveal when it's explicitly called
              return _this2.close.apply(_this2);
            }
          },
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': function resizemeZfTrigger() {
            _this._updatePosition();
          }
        });

        if (this.$anchor.length) {
          this.$anchor.on('keydown.zf.reveal', function (e) {
            if (e.which === 13 || e.which === 32) {
              e.stopPropagation();
              e.preventDefault();
              _this.open();
            }
          });
        }

        if (this.options.closeOnClick && this.options.overlay) {
          this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target) || !$.contains(document, e.target)) {
              return;
            }
            _this.close();
          });
        }
        if (this.options.deepLink) {
          $(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
        }
      }

      /**
       * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
       * @private
       */

    }, {
      key: '_handleState',
      value: function _handleState(e) {
        if (window.location.hash === '#' + this.id && !this.isActive) {
          this.open();
        } else {
          this.close();
        }
      }

      /**
       * Opens the modal controlled by `this.$anchor`, and closes all others by default.
       * @function
       * @fires Reveal#closeme
       * @fires Reveal#open
       */

    }, {
      key: 'open',
      value: function open() {
        var _this3 = this;

        if (this.options.deepLink) {
          var hash = '#' + this.id;

          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.isActive = true;

        // Make elements invisible, but remove display: none so we can get size and positioning
        this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
        if (this.options.overlay) {
          this.$overlay.css({ 'visibility': 'hidden' }).show();
        }

        this._updatePosition();

        this.$element.hide().css({ 'visibility': '' });

        if (this.$overlay) {
          this.$overlay.css({ 'visibility': '' }).hide();
          if (this.$element.hasClass('fast')) {
            this.$overlay.addClass('fast');
          } else if (this.$element.hasClass('slow')) {
            this.$overlay.addClass('slow');
          }
        }

        if (!this.options.multipleOpened) {
          /**
           * Fires immediately before the modal opens.
           * Closes any other modals that are currently open
           * @event Reveal#closeme
           */
          this.$element.trigger('closeme.zf.reveal', this.id);
        }
        // Motion UI method of reveal
        if (this.options.animationIn) {
          var afterAnimationFocus = function afterAnimationFocus() {
            _this.$element.attr({
              'aria-hidden': false,
              'tabindex': -1
            }).focus();
          };

          var _this = this;

          if (this.options.overlay) {
            Foundation.Motion.animateIn(this.$overlay, 'fade-in');
          }
          Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
            _this3.focusableElements = Foundation.Keyboard.findFocusable(_this3.$element);
            afterAnimationFocus();
          });
        }
        // jQuery method of reveal
        else {
            if (this.options.overlay) {
              this.$overlay.show(0);
            }
            this.$element.show(this.options.showDelay);
          }

        // handle accessibility
        this.$element.attr({
          'aria-hidden': false,
          'tabindex': -1
        }).focus();

        /**
         * Fires when the modal has successfully opened.
         * @event Reveal#open
         */
        this.$element.trigger('open.zf.reveal');

        if (this.isMobile) {
          this.originalScrollPos = window.pageYOffset;
          $('html, body').addClass('is-reveal-open');
        } else {
          $('body').addClass('is-reveal-open');
        }

        setTimeout(function () {
          _this3._extraHandlers();
        }, 0);
      }

      /**
       * Adds extra event handlers for the body and window if necessary.
       * @private
       */

    }, {
      key: '_extraHandlers',
      value: function _extraHandlers() {
        var _this = this;
        this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

        if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
          $('body').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target) || !$.contains(document, e.target)) {
              return;
            }
            _this.close();
          });
        }

        if (this.options.closeOnEsc) {
          $(window).on('keydown.zf.reveal', function (e) {
            Foundation.Keyboard.handleKey(e, 'Reveal', {
              close: function close() {
                if (_this.options.closeOnEsc) {
                  _this.close();
                  _this.$anchor.focus();
                }
              }
            });
          });
        }

        // lock focus within modal while tabbing
        this.$element.on('keydown.zf.reveal', function (e) {
          var $target = $(this);
          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            tab_forward: function tab_forward() {
              _this.focusableElements = Foundation.Keyboard.findFocusable(_this.$element);
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                _this.focusableElements.eq(0).focus();
                return true;
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                return true;
              }
            },
            tab_backward: function tab_backward() {
              _this.focusableElements = Foundation.Keyboard.findFocusable(_this.$element);
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                _this.focusableElements.eq(-1).focus();
                return true;
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                return true;
              }
            },
            open: function open() {
              if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
                setTimeout(function () {
                  // set focus back to anchor if close button has been activated
                  _this.$anchor.focus();
                }, 1);
              } else if ($target.is(_this.focusableElements)) {
                // dont't trigger if acual element has focus (i.e. inputs, links, ...)
                _this.open();
              }
            },
            close: function close() {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            },
            handled: function handled(preventDefault) {
              if (preventDefault) {
                e.preventDefault();
              }
            }
          });
        });
      }

      /**
       * Closes the modal.
       * @function
       * @fires Reveal#closed
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.isActive || !this.$element.is(':visible')) {
          return false;
        }
        var _this = this;

        // Motion UI method of hiding
        if (this.options.animationOut) {
          if (this.options.overlay) {
            Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
          } else {
            finishUp();
          }

          Foundation.Motion.animateOut(this.$element, this.options.animationOut);
        }
        // jQuery method of hiding
        else {
            if (this.options.overlay) {
              this.$overlay.hide(0, finishUp);
            } else {
              finishUp();
            }

            this.$element.hide(this.options.hideDelay);
          }

        // Conditionals to remove extra event listeners added on open
        if (this.options.closeOnEsc) {
          $(window).off('keydown.zf.reveal');
        }

        if (!this.options.overlay && this.options.closeOnClick) {
          $('body').off('click.zf.reveal');
        }

        this.$element.off('keydown.zf.reveal');

        function finishUp() {
          if (_this.isMobile) {
            $('html, body').removeClass('is-reveal-open');
            if (_this.originalScrollPos) {
              $('body').scrollTop(_this.originalScrollPos);
              _this.originalScrollPos = null;
            }
          } else {
            $('body').removeClass('is-reveal-open');
          }

          _this.$element.attr('aria-hidden', true);

          /**
          * Fires when the modal is done closing.
          * @event Reveal#closed
          */
          _this.$element.trigger('closed.zf.reveal');
        }

        /**
        * Resets the modal content
        * This prevents a running video to keep going in the background
        */
        if (this.options.resetOnClose) {
          this.$element.html(this.$element.html());
        }

        this.isActive = false;
        if (_this.options.deepLink) {
          if (window.history.replaceState) {
            window.history.replaceState("", document.title, window.location.pathname);
          } else {
            window.location.hash = '';
          }
        }
      }

      /**
       * Toggles the open/closed state of a modal.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'destroy',


      /**
       * Destroys an instance of a modal.
       * @function
       */
      value: function destroy() {
        if (this.options.overlay) {
          this.$element.appendTo($('body')); // move $element outside of $overlay to prevent error unregisterPlugin()
          this.$overlay.hide().off().remove();
        }
        this.$element.hide().off();
        this.$anchor.off('.zf');
        $(window).off('.zf.reveal:' + this.id);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Reveal;
  }();

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example auto
     */
    vOffset: 'auto',
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example auto
     */
    hOffset: 'auto',
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @example false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @example false
     */
    deepLink: false
  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }

  function androidSniff() {
    return (/Android/.test(window.navigator.userAgent)
    );
  }

  function mobileSniff() {
    return iPhoneSniff() || androidSniff();
  }
}(jQuery);
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tabs module.
   * @module foundation.tabs
   * @requires foundation.util.keyboard
   * @requires foundation.util.timerAndImageLoader if tabs contain images
   */

  var Tabs = function () {
    /**
     * Creates a new instance of tabs.
     * @class
     * @fires Tabs#init
     * @param {jQuery} element - jQuery object to make into tabs.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Tabs(element, options) {
      _classCallCheck(this, Tabs);

      this.$element = element;
      this.options = $.extend({}, Tabs.defaults, this.$element.data(), options);

      this._init();
      Foundation.registerPlugin(this, 'Tabs');
      Foundation.Keyboard.register('Tabs', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'previous',
        'ARROW_DOWN': 'next',
        'ARROW_LEFT': 'previous'
        // 'TAB': 'next',
        // 'SHIFT_TAB': 'previous'
      });
    }

    /**
     * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
     * @private
     */


    _createClass(Tabs, [{
      key: '_init',
      value: function _init() {
        var _this = this;

        this.$tabTitles = this.$element.find('.' + this.options.linkClass);
        this.$tabContent = $('[data-tabs-content="' + this.$element[0].id + '"]');

        this.$tabTitles.each(function () {
          var $elem = $(this),
              $link = $elem.find('a'),
              isActive = $elem.hasClass('is-active'),
              hash = $link[0].hash.slice(1),
              linkId = $link[0].id ? $link[0].id : hash + '-label',
              $tabContent = $('#' + hash);

          $elem.attr({ 'role': 'presentation' });

          $link.attr({
            'role': 'tab',
            'aria-controls': hash,
            'aria-selected': isActive,
            'id': linkId
          });

          $tabContent.attr({
            'role': 'tabpanel',
            'aria-hidden': !isActive,
            'aria-labelledby': linkId
          });

          if (isActive && _this.options.autoFocus) {
            $link.focus();
          }
        });

        if (this.options.matchHeight) {
          var $images = this.$tabContent.find('img');

          if ($images.length) {
            Foundation.onImagesLoaded($images, this._setHeight.bind(this));
          } else {
            this._setHeight();
          }
        }

        this._events();
      }

      /**
       * Adds event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this._addKeyHandler();
        this._addClickHandler();
        this._setHeightMqHandler = null;

        if (this.options.matchHeight) {
          this._setHeightMqHandler = this._setHeight.bind(this);

          $(window).on('changed.zf.mediaquery', this._setHeightMqHandler);
        }
      }

      /**
       * Adds click handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addClickHandler',
      value: function _addClickHandler() {
        var _this = this;

        this.$element.off('click.zf.tabs').on('click.zf.tabs', '.' + this.options.linkClass, function (e) {
          e.preventDefault();
          e.stopPropagation();
          if ($(this).hasClass('is-active')) {
            return;
          }
          _this._handleTabChange($(this));
        });
      }

      /**
       * Adds keyboard event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addKeyHandler',
      value: function _addKeyHandler() {
        var _this = this;
        var $firstTab = _this.$element.find('li:first-of-type');
        var $lastTab = _this.$element.find('li:last-of-type');

        this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function (e) {
          if (e.which === 9) return;

          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              if (_this.options.wrapOnKeys) {
                $prevElement = i === 0 ? $elements.last() : $elements.eq(i - 1);
                $nextElement = i === $elements.length - 1 ? $elements.first() : $elements.eq(i + 1);
              } else {
                $prevElement = $elements.eq(Math.max(0, i - 1));
                $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              }
              return;
            }
          });

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Tabs', {
            open: function open() {
              $element.find('[role="tab"]').focus();
              _this._handleTabChange($element);
            },
            previous: function previous() {
              $prevElement.find('[role="tab"]').focus();
              _this._handleTabChange($prevElement);
            },
            next: function next() {
              $nextElement.find('[role="tab"]').focus();
              _this._handleTabChange($nextElement);
            },
            handled: function handled() {
              e.stopPropagation();
              e.preventDefault();
            }
          });
        });
      }

      /**
       * Opens the tab `$targetContent` defined by `$target`.
       * @param {jQuery} $target - Tab to open.
       * @fires Tabs#change
       * @function
       */

    }, {
      key: '_handleTabChange',
      value: function _handleTabChange($target) {
        var $tabLink = $target.find('[role="tab"]'),
            hash = $tabLink[0].hash,
            $targetContent = this.$tabContent.find(hash),
            $oldTab = this.$element.find('.' + this.options.linkClass + '.is-active').removeClass('is-active').find('[role="tab"]').attr({ 'aria-selected': 'false' });

        $('#' + $oldTab.attr('aria-controls')).removeClass('is-active').attr({ 'aria-hidden': 'true' });

        $target.addClass('is-active');

        $tabLink.attr({ 'aria-selected': 'true' });

        $targetContent.addClass('is-active').attr({ 'aria-hidden': 'false' });

        /**
         * Fires when the plugin has successfully changed tabs.
         * @event Tabs#change
         */
        this.$element.trigger('change.zf.tabs', [$target]);
      }

      /**
       * Public method for selecting a content pane to display.
       * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
       * @function
       */

    }, {
      key: 'selectTab',
      value: function selectTab(elem) {
        var idStr;

        if ((typeof elem === 'undefined' ? 'undefined' : _typeof(elem)) === 'object') {
          idStr = elem[0].id;
        } else {
          idStr = elem;
        }

        if (idStr.indexOf('#') < 0) {
          idStr = '#' + idStr;
        }

        var $target = this.$tabTitles.find('[href="' + idStr + '"]').parent('.' + this.options.linkClass);

        this._handleTabChange($target);
      }
    }, {
      key: '_setHeight',

      /**
       * Sets the height of each panel to the height of the tallest panel.
       * If enabled in options, gets called on media query change.
       * If loading content via external source, can be called directly or with _reflow.
       * @function
       * @private
       */
      value: function _setHeight() {
        var max = 0;
        this.$tabContent.find('.' + this.options.panelClass).css('height', '').each(function () {
          var panel = $(this),
              isActive = panel.hasClass('is-active');

          if (!isActive) {
            panel.css({ 'visibility': 'hidden', 'display': 'block' });
          }

          var temp = this.getBoundingClientRect().height;

          if (!isActive) {
            panel.css({
              'visibility': '',
              'display': ''
            });
          }

          max = temp > max ? temp : max;
        }).css('height', max + 'px');
      }

      /**
       * Destroys an instance of an tabs.
       * @fires Tabs#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('.' + this.options.linkClass).off('.zf.tabs').hide().end().find('.' + this.options.panelClass).hide();

        if (this.options.matchHeight) {
          if (this._setHeightMqHandler != null) {
            $(window).off('changed.zf.mediaquery', this._setHeightMqHandler);
          }
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tabs;
  }();

  Tabs.defaults = {
    /**
     * Allows the window to scroll to content of active pane on load if set to true.
     * @option
     * @example false
     */
    autoFocus: false,

    /**
     * Allows keyboard input to 'wrap' around the tab links.
     * @option
     * @example true
     */
    wrapOnKeys: true,

    /**
     * Allows the tab content panes to match heights if set to true.
     * @option
     * @example false
     */
    matchHeight: false,

    /**
     * Class applied to `li`'s in tab link list.
     * @option
     * @example 'tabs-title'
     */
    linkClass: 'tabs-title',

    /**
     * Class applied to the content containers.
     * @option
     * @example 'tabs-panel'
     */
    panelClass: 'tabs-panel'
  };

  function checkClass($elem) {
    return $elem.hasClass('is-active');
  }

  // Window exports
  Foundation.plugin(Tabs, 'Tabs');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  var Toggler = function () {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Toggler(element, options) {
      _classCallCheck(this, Toggler);

      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */


    _createClass(Toggler, [{
      key: '_init',
      value: function _init() {
        var input;
        // Parse animation classes if they were set
        if (this.options.animate) {
          input = this.options.animate.split(' ');

          this.animationIn = input[0];
          this.animationOut = input[1] || null;
        }
        // Otherwise, parse toggle class
        else {
            input = this.$element.data('toggler');
            // Allow for a . at the beginning of the string
            this.className = input[0] === '.' ? input.slice(1) : input;
          }

        // Add ARIA attributes to triggers
        var id = this.$element[0].id;
        $('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-controls', id);
        // If the target is hidden, add aria-hidden
        this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
      }

      /**
       * Initializes events for the toggle trigger.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
      }

      /**
       * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
       * @function
       * @fires Toggler#on
       * @fires Toggler#off
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
      }
    }, {
      key: '_toggleClass',
      value: function _toggleClass() {
        this.$element.toggleClass(this.className);

        var isOn = this.$element.hasClass(this.className);
        if (isOn) {
          /**
           * Fires if the target element has the class after a toggle.
           * @event Toggler#on
           */
          this.$element.trigger('on.zf.toggler');
        } else {
          /**
           * Fires if the target element does not have the class after a toggle.
           * @event Toggler#off
           */
          this.$element.trigger('off.zf.toggler');
        }

        this._updateARIA(isOn);
      }
    }, {
      key: '_toggleAnimate',
      value: function _toggleAnimate() {
        var _this = this;

        if (this.$element.is(':hidden')) {
          Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
            _this._updateARIA(true);
            this.trigger('on.zf.toggler');
          });
        } else {
          Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
            _this._updateARIA(false);
            this.trigger('off.zf.toggler');
          });
        }
      }
    }, {
      key: '_updateARIA',
      value: function _updateARIA(isOn) {
        this.$element.attr('aria-expanded', isOn ? true : false);
      }

      /**
       * Destroys the instance of Toggler on the element.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.toggler');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Toggler;
  }();

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function animateIn(element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function animateOut(element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;"use strict";

(function ($) {
    var ion2sImage = function () {
        function ion2sImage(element, options) {
            this.element = element;
            this.options = options;
            this._init();
            Foundation.registerPlugin(this, 'ion2sImage');
        }
        ion2sImage.prototype._init = function () {
            this.element.click(function (evt) {
                var modal = $("#media-modal");
                var modal_content = $("#media-modal-content");
                modal_content.html("");
                var i = new Image();
                var _this = this;
                i.onprogress = function (event) {
                    var percentage = 0;
                    console.log(event);
                    if (event.lengthComputable) {
                        percentage = event.loaded / event.total * 100;
                    }
                    console.log(percentage);
                    _this.height(percentage + "%");
                };
                i.src = evt.currentTarget.href;
                modal_content.append(i);
                i.onload = function () {
                    return modal.foundation('open');
                };
                evt.preventDefault();
            });
            this._events();
        };
        ion2sImage.prototype._events = function () {};
        ion2sImage.prototype.destroy = function () {
            this.element.unbind('click');
            Foundation.unregisterPlugin(this);
        };
        return ion2sImage;
    }();
    Foundation.plugin(ion2sImage, 'ion2sImage');
})(jQuery);
;"use strict";

(function ($) {
    $(".toggler").click(function () {
        var _this = $(this);
        if (_this.hasClass("toggleme")) {
            _this.toggleClass("toggled");
        } else {
            _this.siblings(".toggleme").toggleClass("toggled");
        }
        var exchangeText = _this.data("toggle");
        if (exchangeText == "") {
            _this.data("toggle", _this.html());
            return;
        }
        _this.data("toggle", _this.html());
        _this.html(exchangeText);
    });
})(jQuery);
;'use strict';

if (!window['YT']) {
    var YT = { loading: 0, loaded: 0 };
}
if (!window['YTConfig']) {
    var YTConfig = { 'host': 'http://www.youtube.com' };
}
if (!YT.loading) {
    YT.loading = 1;
    (function () {
        var l = [];YT.ready = function (f) {
            if (YT.loaded) {
                f();
            } else {
                l.push(f);
            }
        };window.onYTReady = function () {
            YT.loaded = 1;for (var i = 0; i < l.length; i++) {
                try {
                    l[i]();
                } catch (e) {}
            }
        };YT.setConfig = function (c) {
            for (var k in c) {
                if (c.hasOwnProperty(k)) {
                    YTConfig[k] = c[k];
                }
            }
        };var a = document.createElement('script');a.type = 'text/javascript';a.id = 'www-widgetapi-script';a.src = 'https:' + '//s.ytimg.com/yts/jsbin/www-widgetapi-vflLA-G2O/www-widgetapi.js';a.async = true;var b = document.getElementsByTagName('script')[0];b.parentNode.insertBefore(a, b);
    })();
}
(function ($) {
    var ion2sYoutube = function () {
        function ion2sYoutube(element, options) {
            this.element = element;
            this.options = options;
            this._init();
            Foundation.registerPlugin(this, 'ion2sYoutube');
        }
        ion2sYoutube.prototype._init = function () {
            this.element.click(function (evt) {
                var obj = $(this);
                console.log(obj);
                var modal = $("#media-modal");
                var modal_content = $("#media-modal-content");
                modal_content.html("<div id='player'></div>");
                var player = new YT.Player('player', {
                    videoId: obj.data('ion2s-youtube'),
                    events: {
                        'onReady': function onReady(event) {
                            event.target.playVideo();
                            modal.foundation('open');
                        }
                    }
                });
                evt.preventDefault();
            });
            this._events();
        };
        ion2sYoutube.prototype._events = function () {};
        ion2sYoutube.prototype.destroy = function () {
            this.element.unbind('click');
            Foundation.unregisterPlugin(this);
        };
        return ion2sYoutube;
    }();
    Foundation.plugin(ion2sYoutube, 'ion2sYoutube');
    function onYouTubeIframeAPIReady() {}
})(jQuery);
;"use strict";

(function ($) {
    var particles = ["/img/pointer_01.png", "/img/cloud_01.png", "/img/symbol_01.png"];
    function getParticle() {
        return particles[Math.floor(Math.random() * particles.length)];
    }
    var effectFadeObject = $(".effect-fade-spawn");
    var FadeParticle = function () {
        function FadeParticle(parent, img) {
            var _this = this;
            this.parent = parent;
            this.obj = $("<img class='pointer' src='" + img + "'/>");
            parent.append(this.obj);
            this.opacity = 0;
            this.decay = false;
            this.x = Math.random() * parent.width();
            this.y = Math.random() * parent.height();
            var size = 20 + Math.random() * 20;
            this.speed = Math.floor(3 + 3 * Math.random());
            this.obj.css({ left: this.x, top: this.y });
            if (Math.random() > 0.5) {
                this.obj.css({ height: size + "px" });
            } else {
                this.obj.css({ width: size + "px" });
            }
            var degree = Math.random() * 360;
            this.obj.css({
                '-webkit-transform': 'rotate(' + degree + 'deg)',
                '-moz-transform': 'rotate(' + degree + 'deg)',
                '-ms-transform': 'rotate(' + degree + 'deg)',
                '-o-transform': 'rotate(' + degree + 'deg)',
                'transform': 'rotate(' + degree + 'deg)',
                'zoom': 1
            });
            this.interval = setInterval(function () {
                return _this.move();
            }, 200);
            setTimeout(function () {
                return _this.obj.show();
            }, 250);
        }
        FadeParticle.prototype.move = function () {
            if (this.decay) {
                if (this.opacity <= 0) {
                    clearInterval(this.interval);
                    this.obj.remove();
                }
                this.opacity -= this.speed;
            } else {
                this.opacity += this.speed;
                if (this.opacity >= 100) {
                    this.decay = true;
                }
            }
            this.obj.css({ opacity: this.opacity * 0.01 });
        };
        return FadeParticle;
    }();
    function createFadeParticle() {
        effectFadeObject.each(function () {
            new FadeParticle($(this), getParticle());
        });
    }
    function createParticleAgain() {
        createFadeParticle();
        setTimeout(createParticleAgain, 250 + Math.random() * 750);
    }
})(jQuery);
;"use strict";

(function ($) {
    var particle_files = [stylesheet_directory_uri + "/img/icons/p001.png", stylesheet_directory_uri + "/img/icons/p002.png", stylesheet_directory_uri + "/img/icons/p003.png", stylesheet_directory_uri + "/img/icons/p004.png", stylesheet_directory_uri + "/img/icons/p005.png", stylesheet_directory_uri + "/img/icons/p006.png", stylesheet_directory_uri + "/img/icons/p007.png", stylesheet_directory_uri + "/img/icons/p008.png", stylesheet_directory_uri + "/img/icons/p009.png", stylesheet_directory_uri + "/img/icons/p010.png", stylesheet_directory_uri + "/img/icons/p011.png", stylesheet_directory_uri + "/img/icons/p012.png", stylesheet_directory_uri + "/img/icons/p013.png", stylesheet_directory_uri + "/img/icons/p014.png", stylesheet_directory_uri + "/img/icons/p015.png", stylesheet_directory_uri + "/img/icons/p016.png", stylesheet_directory_uri + "/img/icons/p017.png", stylesheet_directory_uri + "/img/icons/p018.png", stylesheet_directory_uri + "/img/icons/p019.png", stylesheet_directory_uri + "/img/icons/p020.png", stylesheet_directory_uri + "/img/icons/p021.png", stylesheet_directory_uri + "/img/icons/p022.png", stylesheet_directory_uri + "/img/icons/p023.png", stylesheet_directory_uri + "/img/kontakt-pfeile-links.svg", stylesheet_directory_uri + "/img/kontakt-pfeile-rechts.svg", stylesheet_directory_uri + "/img/hero-stage-pfeile.svg", stylesheet_directory_uri + "/img/wemoda_hero_V20161121.svg", stylesheet_directory_uri + "/img/wemoda_hero_V20170410.svg"];
    function getFile() {
        return particle_files[Math.floor(Math.random() * particle_files.length)];
    }
    var hero_anchor = $(".next-container");
    var hero_base = $("#Hero");
    var contact_anchor = $(".contact-container");
    var contact_base = $("#Kontakt");
    var Particle = function () {
        function Particle(parent, img, x, y, size, degree) {
            var _this = this;
            if (x === void 0) {
                x = Math.random() * parent.width();
            }
            if (y === void 0) {
                y = Math.random() * parent.width();
            }
            if (size === void 0) {
                size = 20 + Math.random() * 20;
            }
            if (degree === void 0) {
                degree = Math.random() * 360;
            }
            this.parent = parent;
            this.x = x;
            this.y = y;
            this.size = size;
            this.degree = degree;
            this.obj = $("<img class='pointer' src='" + img + "'/>");
            parent.append(this.obj);
            this.scale();
            this.rotate();
            this.move();
            setTimeout(function () {
                return _this.obj.show();
            }, 10);
        }
        Particle.prototype.rotate = function (degree) {
            if (degree === void 0) {
                degree = this.degree;
            }
            this.obj.css({
                '-webkit-transform': 'rotate(' + degree + 'deg)',
                '-moz-transform': 'rotate(' + degree + 'deg)',
                '-ms-transform': 'rotate(' + degree + 'deg)',
                '-o-transform': 'rotate(' + degree + 'deg)',
                'transform': 'rotate(' + degree + 'deg)',
                'zoom': 1
            });
        };
        Particle.prototype.scale = function (size) {
            if (size === void 0) {
                size = this.size;
            }
            this.obj.css({ height: size });
        };
        Particle.prototype.move = function (x, y) {
            if (x === void 0) {
                x = this.x;
            }
            if (y === void 0) {
                y = this.y;
            }
            this.obj.css({ left: this.x, top: this.y });
        };
        return Particle;
    }();
    var particles = [new Particle(contact_anchor, particle_files[23], "-53%", "20%", "55%", 0), new Particle(contact_anchor, particle_files[24], "82%", "12%", "80%", 0), new Particle(hero_anchor, particle_files[27], "86%", "-43%", "132%", 0)];
    console.log(particles);
})(jQuery);
;"use strict";

function throttle(fn, threshold, scope) {
    threshold || (threshold = 250);
    var last, deferTimer;
    return function () {
        var context = scope || this;
        var now = +new Date(),
            args = arguments;
        if (last && now < last + threshold) {
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}
var isMobile = false;
(function ($) {
    var NavBar = $("#nav-wrapper");
    var Dropdown = NavBar.find(".top-bar-left");
    var ResponsiveMenuButton = NavBar.find("[data-responsive-toggle='responsive-menu']");
    var oldposition = 0;
    $(window).scroll(throttle(function (event) {
        var scrollPos = window.scrollY;
        if (!scrollPos) {
            scrollPos = document.documentElement.scrollTop;
        }
        var dir = oldposition >= scrollPos ? 0 : 1;
        oldposition = scrollPos;
        if (!isMobile) {
            if (scrollPos < 0) {
                console.log("ISMOBIDE");
                isMobile = true;
            }
        }
        var NavHeight = NavBar.outerHeight();
        if (1 == dir) {
            if ((Dropdown.css('display') != 'block' || ResponsiveMenuButton.css('display') != 'block') && !isMobile || isMobile && scrollPos > 10) {
                NavBar.css({ 'top': -NavHeight + "px" });
            } else if (isMobile) {
                NavBar.css({ 'top': 0 + "px" });
            }
        } else {
            NavBar.css({ 'top': 0 + "px" });
        }
    }, 250));
})(jQuery);
;'use strict';

(function ($) {
    $(document).foundation();
    $(document).find('#responsive-menu').click(function (event) {
        $('.toggle-top-bar').click();
    });
})(jQuery);
;"use strict";

(function ($) {
    function sendNewsletter() {
        if (!$("div.em-booking-message-success").length) {
            setTimeout(sendNewsletter, 100);
            return;
        }
        $("#Newsletter input[type=\"submit\"]").click();
    }
    if ($("div.event").length) {
        $("div.event .em-booking-submit").click(function () {
            if ($("#newsletter_for_event").prop('checked')) {
                var name_1 = $('input[name="user_name"]').val();
                var mail = $('input[name="user_email"]').val();
                var regex = /([^ ]*).+?([^ ]*.*)/g;
                var match = regex.exec(name_1);
                var name1 = match[1];
                var name2 = match[2];
                $('#E-Mail').val(mail);
                $('#Vorname').val(name1);
                $('#Nachname').val(name2);
                sendNewsletter();
            }
        });
    }
})(jQuery);
;"use strict";

(function ($) {
    if (new RegExp("#talk-[0-9]*").test(window.location.hash)) {
        $("#" + $(window.location.hash).parent().attr('id') + "-label").click();
        $(window.location.hash).find(".toggler").click();
    }
})(jQuery);
;"use strict";
;'use strict';

function scrollToAnchor(href, e) {
    var $ = jQuery;
    var bonus = $("nav").outerHeight();
    $('html, body').animate({
        scrollTop: $(href).offset().top - bonus
    }, 300, function () {
        setTimeout(function () {
            $('html, body').scroll();
        }, 230);
    });
    if (e) {
        e.preventDefault();
    }
}
(function ($) {
    $('.anchor-scroll').on('click', function (e) {
        var href = /#.*/.exec($(this).attr('href'))[0];
        scrollToAnchor(href, e);
    });
})(jQuery);
;"use strict";

(function ($) {
    function getList(object) {
        if (object === void 0) {
            object = $(".acf-wemoda-authors");
        }
        var value = object.val();
        if (value) {
            return JSON.parse(value);
        }
        return [];
    }
    function appendInputs(rows, name, label, link) {
        if (rows === void 0) {
            rows = $(".acf-wemoda-authors ~ .fields > div.rows");
        }
        var row = $("<div>").addClass("row").appendTo(rows).css("display", "flex");
        var labelName = $('<label>').appendTo(row).text('Name des Autors').css("margin", "1em");
        $('<input type="text">').addClass("name").appendTo(labelName).val(name).on('change', updateData);
        var labelLabel = $('<label>').appendTo(row).text('(Twitter)-Label').css("margin", "1em");
        $('<input type="text">').addClass("label").appendTo(labelLabel).val(label).on('change', updateData);
        var labelLink = $('<label>').appendTo(row).text('Link des Labels').css("margin", "1em");
        $('<input type="text">').addClass("link").appendTo(labelLink).val(link).on('change', updateData);
        $('<div>').appendTo(row).text("Autor Entfernen").click(removeAuthor).addClass('button button-primary button-large').css("margin", "1em").css("align-self", "flex-end");
    }
    function initFields(list, inputs) {
        if (list === void 0) {
            list = getList();
        }
        if (inputs === void 0) {
            inputs = $(".acf-wemoda-authors ~ .fields");
        }
        inputs.html("");
        var rows = $("<div>").appendTo(inputs).addClass("rows");
        $(list).each(function (i, li) {
            appendInputs(rows, li.name, li.label, li.link);
        });
        $("<div>").appendTo(inputs).text('Autor Hinzufügen').click(addNewAuthor).addClass('button button-primary button-large');
    }
    function addNewAuthor(event) {
        appendInputs(void 0, "", "", "");
    }
    function removeAuthor(event, authorField) {
        if (authorField === void 0) {
            authorField = $(".acf-wemoda-authors");
        }
        var object = $(event.target).parent();
        var other = object.parent();
        object.remove();
        var inputs = other.find('input');
        if (!inputs.length) {
            authorField.val("");
        } else {
            inputs.trigger("change");
        }
    }
    function updateData(event, authorField) {
        if (authorField === void 0) {
            authorField = $(".acf-wemoda-authors");
        }
        var object = $(event.target).parents('.rows');
        var data = [];
        object.children('.row').each(function (i, r) {
            var row = $(r);
            var name = row.find('.name').val();
            var label = row.find('.label').val();
            var link = row.find('.link').val();
            data.push({
                'name': name,
                'label': label,
                'link': link
            });
        });
        authorField.val(JSON.stringify(data));
    }
    $(document).ready(function () {
        var authorField = $(".acf-wemoda-authors");
        var authorInputs = $(".acf-wemoda-authors ~ .fields");
        if (authorField.length) {
            var list = getList();
            initFields(list);
        }
    });
})(jQuery);
;'use strict';

(function ($) {
    function initColorPicker(widget) {
        widget.find('.color-field').wpColorPicker({
            change: _.throttle(function () {
                $(this).trigger('change');
            }, 700, { leading: false }),
            palettes: ['#000000', '#FFFFFF', '#F9B000', '#97C666', '#5FC4E0', '#C3D200', '#77C4B0', '#FFED00']
        });
    }
    function onFormUpdate(event, widget) {
        console.log("EVENT:", event, widget);
        initColorPicker(widget);
    }
    $(document).on('widget-added widget-updated', onFormUpdate);
    $(document).ready(function () {
        $('#widgets-right .widget:has(.color-field)').each(function () {
            initColorPicker($(this));
        });
    });
})(jQuery);
;"use strict";

(function ($) {
    if (document.documentMode) {
        $("body").addClass("fix-image");
        $("body").addClass("fix-flexbox");
    }
    if (/Safari/.test(navigator.userAgent) || /Edge/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
        $("body").addClass("fix-image");
    }
})(jQuery);
;"use strict";

(function ($) {
    function getMeta(name) {
        return $(document.querySelector("meta[name='" + name + "']"));
    }
    function swap_attr(tag, attr1, attr2) {
        var bubble = tag.attr(attr1);
        tag.attr(attr1, tag.attr(attr2));
        tag.attr(attr2, bubble);
    }
    var tag = getMeta('viewport');
    var position = 0;
    $(document).on('open.zf.reveal', '[data-reveal]', function () {
        swap_attr(tag, 'content', 'data-alt-content');
        position = $(document).scrollTop();
    });
    $(document).on('closed.zf.reveal', '[data-reveal]', function () {
        swap_attr(tag, 'content', 'data-alt-content');
        $('html, body').animate({
            scrollTop: position
        }, 'fast');
    });
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5ib3guanMiLCJmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsImZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJmb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsImZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwiZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwiZm91bmRhdGlvbi5hYmlkZS5qcyIsImZvdW5kYXRpb24uZHJvcGRvd24uanMiLCJmb3VuZGF0aW9uLmRyb3Bkb3duTWVudS5qcyIsImZvdW5kYXRpb24uaW50ZXJjaGFuZ2UuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51LmpzIiwiZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlLmpzIiwiZm91bmRhdGlvbi5yZXZlYWwuanMiLCJmb3VuZGF0aW9uLnRhYnMuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJtb3Rpb24tdWkuanMiLCJGb3VuZGF0aW9uUGx1Z2lucy9pb24yc0ltYWdlLmpzIiwiRm91bmRhdGlvblBsdWdpbnMvaW9uMnNUb2dnbGUuanMiLCJGb3VuZGF0aW9uUGx1Z2lucy9pb24yc1lvdXR1YmUuanMiLCJhcHAvRWZmZWN0LmpzIiwiYXBwL0ljb25PYmplY3QuanMiLCJhcHAvTmF2U2Nyb2xsLmpzIiwiYXBwL2FwcC5qcyIsImFwcC9ib29raW5nX3RvX25ld3NsZXR0ZXIuanMiLCJhcHAvb3BlblRhbGsuanMiLCJhcHAvdGVsbC1hLWZyaWVuZC5qcyIsImZhbmN5L2FuY2hvcnNjcm9sbC5qcyIsInBsdWdpbnMvYXV0aG9ycy5qcyIsInBsdWdpbnMvd3BJbnB1dC5qcyIsInN0eWxlZml4L2Jyb3dzZXJmaXguanMiLCJzdHlsZWZpeC9tb2RhbF96b29tX2hvb2suanMiXSwibmFtZXMiOlsiJCIsIkZPVU5EQVRJT05fVkVSU0lPTiIsIkZvdW5kYXRpb24iLCJ2ZXJzaW9uIiwiX3BsdWdpbnMiLCJfdXVpZHMiLCJydGwiLCJhdHRyIiwicGx1Z2luIiwibmFtZSIsImNsYXNzTmFtZSIsImZ1bmN0aW9uTmFtZSIsImF0dHJOYW1lIiwiaHlwaGVuYXRlIiwicmVnaXN0ZXJQbHVnaW4iLCJwbHVnaW5OYW1lIiwiY29uc3RydWN0b3IiLCJ0b0xvd2VyQ2FzZSIsInV1aWQiLCJHZXRZb0RpZ2l0cyIsIiRlbGVtZW50IiwiZGF0YSIsInRyaWdnZXIiLCJwdXNoIiwidW5yZWdpc3RlclBsdWdpbiIsInNwbGljZSIsImluZGV4T2YiLCJyZW1vdmVBdHRyIiwicmVtb3ZlRGF0YSIsInByb3AiLCJyZUluaXQiLCJwbHVnaW5zIiwiaXNKUSIsImVhY2giLCJfaW5pdCIsInR5cGUiLCJfdGhpcyIsImZucyIsInBsZ3MiLCJmb3JFYWNoIiwicCIsImZvdW5kYXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwibGVuZ3RoIiwibmFtZXNwYWNlIiwiTWF0aCIsInJvdW5kIiwicG93IiwicmFuZG9tIiwidG9TdHJpbmciLCJzbGljZSIsInJlZmxvdyIsImVsZW0iLCJpIiwiJGVsZW0iLCJmaW5kIiwiYWRkQmFjayIsIiRlbCIsIm9wdHMiLCJ3YXJuIiwidGhpbmciLCJzcGxpdCIsImUiLCJvcHQiLCJtYXAiLCJlbCIsInRyaW0iLCJwYXJzZVZhbHVlIiwiZXIiLCJnZXRGbk5hbWUiLCJ0cmFuc2l0aW9uZW5kIiwidHJhbnNpdGlvbnMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJlbmQiLCJ0Iiwic3R5bGUiLCJzZXRUaW1lb3V0IiwidHJpZ2dlckhhbmRsZXIiLCJ1dGlsIiwidGhyb3R0bGUiLCJmdW5jIiwiZGVsYXkiLCJ0aW1lciIsImNvbnRleHQiLCJhcmdzIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJtZXRob2QiLCIkbWV0YSIsIiRub0pTIiwiYXBwZW5kVG8iLCJoZWFkIiwicmVtb3ZlQ2xhc3MiLCJNZWRpYVF1ZXJ5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwicGx1Z0NsYXNzIiwidW5kZWZpbmVkIiwiUmVmZXJlbmNlRXJyb3IiLCJUeXBlRXJyb3IiLCJ3aW5kb3ciLCJmbiIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwidmVuZG9ycyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZwIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibGFzdFRpbWUiLCJjYWxsYmFjayIsIm5leHRUaW1lIiwibWF4IiwiY2xlYXJUaW1lb3V0IiwicGVyZm9ybWFuY2UiLCJzdGFydCIsIkZ1bmN0aW9uIiwiYmluZCIsIm9UaGlzIiwiYUFyZ3MiLCJmVG9CaW5kIiwiZk5PUCIsImZCb3VuZCIsImNvbmNhdCIsImZ1bmNOYW1lUmVnZXgiLCJyZXN1bHRzIiwiZXhlYyIsInN0ciIsImlzTmFOIiwicGFyc2VGbG9hdCIsInJlcGxhY2UiLCJqUXVlcnkiLCJCb3giLCJJbU5vdFRvdWNoaW5nWW91IiwiR2V0RGltZW5zaW9ucyIsIkdldE9mZnNldHMiLCJlbGVtZW50IiwicGFyZW50IiwibHJPbmx5IiwidGJPbmx5IiwiZWxlRGltcyIsInRvcCIsImJvdHRvbSIsImxlZnQiLCJyaWdodCIsInBhckRpbXMiLCJvZmZzZXQiLCJoZWlnaHQiLCJ3aWR0aCIsIndpbmRvd0RpbXMiLCJhbGxEaXJzIiwiRXJyb3IiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicGFyUmVjdCIsInBhcmVudE5vZGUiLCJ3aW5SZWN0IiwiYm9keSIsIndpblkiLCJwYWdlWU9mZnNldCIsIndpblgiLCJwYWdlWE9mZnNldCIsInBhcmVudERpbXMiLCJhbmNob3IiLCJwb3NpdGlvbiIsInZPZmZzZXQiLCJoT2Zmc2V0IiwiaXNPdmVyZmxvdyIsIiRlbGVEaW1zIiwiJGFuY2hvckRpbXMiLCJrZXlDb2RlcyIsImNvbW1hbmRzIiwiS2V5Ym9hcmQiLCJnZXRLZXlDb2RlcyIsInBhcnNlS2V5IiwiZXZlbnQiLCJrZXkiLCJ3aGljaCIsImtleUNvZGUiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ0b1VwcGVyQ2FzZSIsInNoaWZ0S2V5IiwiY3RybEtleSIsImFsdEtleSIsImhhbmRsZUtleSIsImNvbXBvbmVudCIsImZ1bmN0aW9ucyIsImNvbW1hbmRMaXN0IiwiY21kcyIsImNvbW1hbmQiLCJsdHIiLCJleHRlbmQiLCJyZXR1cm5WYWx1ZSIsImhhbmRsZWQiLCJ1bmhhbmRsZWQiLCJmaW5kRm9jdXNhYmxlIiwiZmlsdGVyIiwiaXMiLCJyZWdpc3RlciIsImNvbXBvbmVudE5hbWUiLCJrY3MiLCJrIiwia2MiLCJkZWZhdWx0UXVlcmllcyIsImxhbmRzY2FwZSIsInBvcnRyYWl0IiwicmV0aW5hIiwicXVlcmllcyIsImN1cnJlbnQiLCJzZWxmIiwiZXh0cmFjdGVkU3R5bGVzIiwiY3NzIiwibmFtZWRRdWVyaWVzIiwicGFyc2VTdHlsZVRvT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsIl9nZXRDdXJyZW50U2l6ZSIsIl93YXRjaGVyIiwiYXRMZWFzdCIsInNpemUiLCJxdWVyeSIsImdldCIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwibWF0Y2hlZCIsIm9uIiwibmV3U2l6ZSIsImN1cnJlbnRTaXplIiwic3R5bGVNZWRpYSIsIm1lZGlhIiwic2NyaXB0IiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJpbmZvIiwiaWQiLCJpbnNlcnRCZWZvcmUiLCJnZXRDb21wdXRlZFN0eWxlIiwiY3VycmVudFN0eWxlIiwibWF0Y2hNZWRpdW0iLCJ0ZXh0Iiwic3R5bGVTaGVldCIsImNzc1RleHQiLCJ0ZXh0Q29udGVudCIsInN0eWxlT2JqZWN0IiwicmVkdWNlIiwicmV0IiwicGFyYW0iLCJwYXJ0cyIsInZhbCIsImRlY29kZVVSSUNvbXBvbmVudCIsImlzQXJyYXkiLCJpbml0Q2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJNb3Rpb24iLCJhbmltYXRlSW4iLCJhbmltYXRpb24iLCJjYiIsImFuaW1hdGUiLCJhbmltYXRlT3V0IiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiZXEiLCJpbml0Q2xhc3MiLCJhY3RpdmVDbGFzcyIsInJlc2V0IiwiYWRkQ2xhc3MiLCJzaG93Iiwib2Zmc2V0V2lkdGgiLCJvbmUiLCJmaW5pc2giLCJoaWRlIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwiTmVzdCIsIkZlYXRoZXIiLCJtZW51IiwiaXRlbXMiLCJzdWJNZW51Q2xhc3MiLCJzdWJJdGVtQ2xhc3MiLCJoYXNTdWJDbGFzcyIsIiRpdGVtIiwiJHN1YiIsImNoaWxkcmVuIiwiQnVybiIsIlRpbWVyIiwib3B0aW9ucyIsIm5hbWVTcGFjZSIsInJlbWFpbiIsImlzUGF1c2VkIiwicmVzdGFydCIsImluZmluaXRlIiwicGF1c2UiLCJvbkltYWdlc0xvYWRlZCIsImltYWdlcyIsInVubG9hZGVkIiwiY29tcGxldGUiLCJzaW5nbGVJbWFnZUxvYWRlZCIsIm5hdHVyYWxXaWR0aCIsInNwb3RTd2lwZSIsImVuYWJsZWQiLCJkb2N1bWVudEVsZW1lbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm1vdmVUaHJlc2hvbGQiLCJ0aW1lVGhyZXNob2xkIiwic3RhcnRQb3NYIiwic3RhcnRQb3NZIiwic3RhcnRUaW1lIiwiZWxhcHNlZFRpbWUiLCJpc01vdmluZyIsIm9uVG91Y2hFbmQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Ub3VjaE1vdmUiLCJ4IiwidG91Y2hlcyIsInBhZ2VYIiwieSIsInBhZ2VZIiwiZHgiLCJkeSIsImRpciIsImFicyIsIm9uVG91Y2hTdGFydCIsImFkZEV2ZW50TGlzdGVuZXIiLCJpbml0IiwidGVhcmRvd24iLCJzcGVjaWFsIiwic3dpcGUiLCJzZXR1cCIsIm5vb3AiLCJhZGRUb3VjaCIsImhhbmRsZVRvdWNoIiwiY2hhbmdlZFRvdWNoZXMiLCJmaXJzdCIsImV2ZW50VHlwZXMiLCJ0b3VjaHN0YXJ0IiwidG91Y2htb3ZlIiwidG91Y2hlbmQiLCJzaW11bGF0ZWRFdmVudCIsIk1vdXNlRXZlbnQiLCJzY3JlZW5YIiwic2NyZWVuWSIsImNsaWVudFgiLCJjbGllbnRZIiwiY3JlYXRlRXZlbnQiLCJpbml0TW91c2VFdmVudCIsInRhcmdldCIsImRpc3BhdGNoRXZlbnQiLCJNdXRhdGlvbk9ic2VydmVyIiwicHJlZml4ZXMiLCJ0cmlnZ2VycyIsInN0b3BQcm9wYWdhdGlvbiIsImZhZGVPdXQiLCJjaGVja0xpc3RlbmVycyIsImV2ZW50c0xpc3RlbmVyIiwicmVzaXplTGlzdGVuZXIiLCJzY3JvbGxMaXN0ZW5lciIsImNsb3NlbWVMaXN0ZW5lciIsInlldGlCb3hlcyIsInBsdWdOYW1lcyIsImxpc3RlbmVycyIsImpvaW4iLCJvZmYiLCJwbHVnaW5JZCIsIm5vdCIsImRlYm91bmNlIiwiJG5vZGVzIiwibm9kZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiIsIm11dGF0aW9uUmVjb3Jkc0xpc3QiLCIkdGFyZ2V0IiwiZWxlbWVudE9ic2VydmVyIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJjaGFyYWN0ZXJEYXRhIiwic3VidHJlZSIsImF0dHJpYnV0ZUZpbHRlciIsIklIZWFyWW91IiwiQWJpZGUiLCJkZWZhdWx0cyIsIiRpbnB1dHMiLCJfZXZlbnRzIiwicmVzZXRGb3JtIiwidmFsaWRhdGVGb3JtIiwidmFsaWRhdGVPbiIsInZhbGlkYXRlSW5wdXQiLCJsaXZlVmFsaWRhdGUiLCJpc0dvb2QiLCJjaGVja2VkIiwiJGVycm9yIiwic2libGluZ3MiLCJmb3JtRXJyb3JTZWxlY3RvciIsIiRsYWJlbCIsImNsb3Nlc3QiLCIkZWxzIiwibGFiZWxzIiwiZmluZExhYmVsIiwiJGZvcm1FcnJvciIsImZpbmRGb3JtRXJyb3IiLCJsYWJlbEVycm9yQ2xhc3MiLCJmb3JtRXJyb3JDbGFzcyIsImlucHV0RXJyb3JDbGFzcyIsImdyb3VwTmFtZSIsIiRsYWJlbHMiLCJmaW5kUmFkaW9MYWJlbHMiLCIkZm9ybUVycm9ycyIsInJlbW92ZVJhZGlvRXJyb3JDbGFzc2VzIiwiY2xlYXJSZXF1aXJlIiwicmVxdWlyZWRDaGVjayIsInZhbGlkYXRlZCIsImN1c3RvbVZhbGlkYXRvciIsInZhbGlkYXRvciIsImVxdWFsVG8iLCJ2YWxpZGF0ZVJhZGlvIiwidmFsaWRhdGVUZXh0IiwibWF0Y2hWYWxpZGF0aW9uIiwidmFsaWRhdG9ycyIsImdvb2RUb0dvIiwibWVzc2FnZSIsImFjYyIsIm5vRXJyb3IiLCJwYXR0ZXJuIiwiaW5wdXRUZXh0IiwidmFsaWQiLCJwYXR0ZXJucyIsIlJlZ0V4cCIsIiRncm91cCIsInJlcXVpcmVkIiwiY2xlYXIiLCJ2IiwiJGZvcm0iLCJyZW1vdmVFcnJvckNsYXNzZXMiLCJhbHBoYSIsImFscGhhX251bWVyaWMiLCJpbnRlZ2VyIiwibnVtYmVyIiwiY2FyZCIsImN2diIsImVtYWlsIiwidXJsIiwiZG9tYWluIiwiZGF0ZXRpbWUiLCJkYXRlIiwidGltZSIsImRhdGVJU08iLCJtb250aF9kYXlfeWVhciIsImRheV9tb250aF95ZWFyIiwiY29sb3IiLCJEcm9wZG93biIsIiRpZCIsIiRhbmNob3IiLCJwb3NpdGlvbkNsYXNzIiwiZ2V0UG9zaXRpb25DbGFzcyIsImNvdW50ZXIiLCJ1c2VkUG9zaXRpb25zIiwidmVydGljYWxQb3NpdGlvbiIsIm1hdGNoIiwiaG9yaXpvbnRhbFBvc2l0aW9uIiwiY2xhc3NDaGFuZ2VkIiwiZGlyZWN0aW9uIiwiX3JlcG9zaXRpb24iLCJfc2V0UG9zaXRpb24iLCJvcGVuIiwiY2xvc2UiLCJ0b2dnbGUiLCJob3ZlciIsInRpbWVvdXQiLCJob3ZlckRlbGF5IiwiaG92ZXJQYW5lIiwiYWRkIiwidmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzIiwidGFiX2ZvcndhcmQiLCJ0cmFwRm9jdXMiLCJmb2N1cyIsInRhYl9iYWNrd2FyZCIsIiRib2R5IiwiYXV0b0ZvY3VzIiwiJGZvY3VzYWJsZSIsImNsb3NlT25DbGljayIsIl9hZGRCb2R5SGFuZGxlciIsImhhc0NsYXNzIiwiY3VyUG9zaXRpb25DbGFzcyIsIkRyb3Bkb3duTWVudSIsInN1YnMiLCIkbWVudUl0ZW1zIiwiJHRhYnMiLCJ2ZXJ0aWNhbENsYXNzIiwicmlnaHRDbGFzcyIsImFsaWdubWVudCIsInBhcmVudHMiLCJjaGFuZ2VkIiwiaGFzVG91Y2giLCJvbnRvdWNoc3RhcnQiLCJwYXJDbGFzcyIsImhhbmRsZUNsaWNrRm4iLCJwYXJlbnRzVW50aWwiLCJoYXNTdWIiLCJoYXNDbGlja2VkIiwiY2xpY2tPcGVuIiwiZm9yY2VGb2xsb3ciLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJfaGlkZSIsIl9zaG93IiwiY2xvc2VPbkNsaWNrSW5zaWRlIiwiZGlzYWJsZUhvdmVyIiwiYXV0b2Nsb3NlIiwiY2xvc2luZ1RpbWUiLCJpc1RhYiIsImluZGV4IiwiJGVsZW1lbnRzIiwiJHByZXZFbGVtZW50IiwiJG5leHRFbGVtZW50IiwibmV4dFNpYmxpbmciLCJwcmV2U2libGluZyIsIm9wZW5TdWIiLCJjbG9zZVN1YiIsIl9pc1ZlcnRpY2FsIiwiZG93biIsInVwIiwibmV4dCIsInByZXZpb3VzIiwiJGxpbmsiLCJpZHgiLCIkc2licyIsIm9sZENsYXNzIiwiJHBhcmVudExpIiwiJHRvQ2xvc2UiLCJzb21ldGhpbmdUb0Nsb3NlIiwiSW50ZXJjaGFuZ2UiLCJydWxlcyIsImN1cnJlbnRQYXRoIiwiX2FkZEJyZWFrcG9pbnRzIiwiX2dlbmVyYXRlUnVsZXMiLCJfcmVmbG93IiwicnVsZSIsInBhdGgiLCJTUEVDSUFMX1FVRVJJRVMiLCJydWxlc0xpc3QiLCJub2RlTmFtZSIsInJlc3BvbnNlIiwiaHRtbCIsIlJlc3BvbnNpdmVNZW51IiwiY3VycmVudE1xIiwiY3VycmVudFBsdWdpbiIsInJ1bGVzVHJlZSIsInJ1bGVTaXplIiwicnVsZVBsdWdpbiIsIk1lbnVQbHVnaW5zIiwiaXNFbXB0eU9iamVjdCIsIl9jaGVja01lZGlhUXVlcmllcyIsIm1hdGNoZWRNcSIsImNzc0NsYXNzIiwiZGVzdHJveSIsImRyb3Bkb3duIiwiZHJpbGxkb3duIiwiYWNjb3JkaW9uIiwiUmVzcG9uc2l2ZVRvZ2dsZSIsInRhcmdldElEIiwiJHRhcmdldE1lbnUiLCIkdG9nZ2xlciIsIl91cGRhdGUiLCJfdXBkYXRlTXFIYW5kbGVyIiwidG9nZ2xlTWVudSIsImhpZGVGb3IiLCJSZXZlYWwiLCJpc0FjdGl2ZSIsImNhY2hlZCIsIm1xIiwiaXNNb2JpbGUiLCJtb2JpbGVTbmlmZiIsImZ1bGxTY3JlZW4iLCJvdmVybGF5IiwiJG92ZXJsYXkiLCJfbWFrZU92ZXJsYXkiLCJkZXRhY2giLCJkZWVwTGluayIsImxvY2F0aW9uIiwiaGFzaCIsIm91dGVyV2lkdGgiLCJvdXRlckhlaWdodCIsInBhcnNlSW50IiwibWluIiwibWFyZ2luIiwiX3VwZGF0ZVBvc2l0aW9uIiwiY29udGFpbnMiLCJfaGFuZGxlU3RhdGUiLCJoaXN0b3J5IiwicHVzaFN0YXRlIiwic2Nyb2xsVG9wIiwibXVsdGlwbGVPcGVuZWQiLCJhbmltYXRpb25JbiIsImFmdGVyQW5pbWF0aW9uRm9jdXMiLCJmb2N1c2FibGVFbGVtZW50cyIsInNob3dEZWxheSIsIm9yaWdpbmFsU2Nyb2xsUG9zIiwiX2V4dHJhSGFuZGxlcnMiLCJjbG9zZU9uRXNjIiwiYW5pbWF0aW9uT3V0IiwiZmluaXNoVXAiLCJoaWRlRGVsYXkiLCJyZXNldE9uQ2xvc2UiLCJyZXBsYWNlU3RhdGUiLCJ0aXRsZSIsInBhdGhuYW1lIiwicmVtb3ZlIiwiYnRtT2Zmc2V0UGN0IiwiaVBob25lU25pZmYiLCJhbmRyb2lkU25pZmYiLCJUYWJzIiwiJHRhYlRpdGxlcyIsImxpbmtDbGFzcyIsIiR0YWJDb250ZW50IiwibGlua0lkIiwibWF0Y2hIZWlnaHQiLCIkaW1hZ2VzIiwiX3NldEhlaWdodCIsIl9hZGRLZXlIYW5kbGVyIiwiX2FkZENsaWNrSGFuZGxlciIsIl9zZXRIZWlnaHRNcUhhbmRsZXIiLCJfaGFuZGxlVGFiQ2hhbmdlIiwiJGZpcnN0VGFiIiwiJGxhc3RUYWIiLCJ3cmFwT25LZXlzIiwibGFzdCIsIiR0YWJMaW5rIiwiJHRhcmdldENvbnRlbnQiLCIkb2xkVGFiIiwiaWRTdHIiLCJwYW5lbENsYXNzIiwicGFuZWwiLCJ0ZW1wIiwiY2hlY2tDbGFzcyIsIlRvZ2dsZXIiLCJpbnB1dCIsInRvZ2dsZUNsYXNzIiwiaXNPbiIsIl91cGRhdGVBUklBIiwiZW5kRXZlbnQiLCJNb3Rpb25VSSIsImlvbjJzSW1hZ2UiLCJjbGljayIsImV2dCIsIm1vZGFsIiwibW9kYWxfY29udGVudCIsIkltYWdlIiwib25wcm9ncmVzcyIsInBlcmNlbnRhZ2UiLCJsb2ciLCJsZW5ndGhDb21wdXRhYmxlIiwibG9hZGVkIiwidG90YWwiLCJzcmMiLCJjdXJyZW50VGFyZ2V0IiwiaHJlZiIsImFwcGVuZCIsIm9ubG9hZCIsInVuYmluZCIsImV4Y2hhbmdlVGV4dCIsIllUIiwibG9hZGluZyIsIllUQ29uZmlnIiwibCIsInJlYWR5IiwiZiIsIm9uWVRSZWFkeSIsInNldENvbmZpZyIsImMiLCJhIiwiYXN5bmMiLCJiIiwiaW9uMnNZb3V0dWJlIiwib2JqIiwicGxheWVyIiwiUGxheWVyIiwidmlkZW9JZCIsImV2ZW50cyIsInBsYXlWaWRlbyIsIm9uWW91VHViZUlmcmFtZUFQSVJlYWR5IiwicGFydGljbGVzIiwiZ2V0UGFydGljbGUiLCJmbG9vciIsImVmZmVjdEZhZGVPYmplY3QiLCJGYWRlUGFydGljbGUiLCJpbWciLCJvcGFjaXR5IiwiZGVjYXkiLCJzcGVlZCIsImRlZ3JlZSIsImludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJjbGVhckludGVydmFsIiwiY3JlYXRlRmFkZVBhcnRpY2xlIiwiY3JlYXRlUGFydGljbGVBZ2FpbiIsInBhcnRpY2xlX2ZpbGVzIiwic3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpIiwiZ2V0RmlsZSIsImhlcm9fYW5jaG9yIiwiaGVyb19iYXNlIiwiY29udGFjdF9hbmNob3IiLCJjb250YWN0X2Jhc2UiLCJQYXJ0aWNsZSIsInNjYWxlIiwicm90YXRlIiwidGhyZXNob2xkIiwic2NvcGUiLCJkZWZlclRpbWVyIiwiTmF2QmFyIiwiUmVzcG9uc2l2ZU1lbnVCdXR0b24iLCJvbGRwb3NpdGlvbiIsInNjcm9sbCIsInNjcm9sbFBvcyIsInNjcm9sbFkiLCJOYXZIZWlnaHQiLCJzZW5kTmV3c2xldHRlciIsIm5hbWVfMSIsIm1haWwiLCJyZWdleCIsIm5hbWUxIiwibmFtZTIiLCJzY3JvbGxUb0FuY2hvciIsImJvbnVzIiwiZ2V0TGlzdCIsIm9iamVjdCIsIkpTT04iLCJwYXJzZSIsImFwcGVuZElucHV0cyIsInJvd3MiLCJsYWJlbCIsImxpbmsiLCJyb3ciLCJsYWJlbE5hbWUiLCJ1cGRhdGVEYXRhIiwibGFiZWxMYWJlbCIsImxhYmVsTGluayIsInJlbW92ZUF1dGhvciIsImluaXRGaWVsZHMiLCJsaXN0IiwiaW5wdXRzIiwibGkiLCJhZGROZXdBdXRob3IiLCJhdXRob3JGaWVsZCIsIm90aGVyIiwiciIsInN0cmluZ2lmeSIsImF1dGhvcklucHV0cyIsImluaXRDb2xvclBpY2tlciIsIndpZGdldCIsIndwQ29sb3JQaWNrZXIiLCJjaGFuZ2UiLCJfIiwibGVhZGluZyIsInBhbGV0dGVzIiwib25Gb3JtVXBkYXRlIiwiZG9jdW1lbnRNb2RlIiwiZ2V0TWV0YSIsInF1ZXJ5U2VsZWN0b3IiLCJzd2FwX2F0dHIiLCJ0YWciLCJhdHRyMSIsImF0dHIyIiwiYnViYmxlIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsQ0FBQyxVQUFTQSxDQUFULEVBQVk7O0FBRWI7O0FBRUEsTUFBSUMscUJBQXFCLE9BQXpCOztBQUVBO0FBQ0E7QUFDQSxNQUFJQyxhQUFhO0FBQ2ZDLGFBQVNGLGtCQURNOztBQUdmOzs7QUFHQUcsY0FBVSxFQU5LOztBQVFmOzs7QUFHQUMsWUFBUSxFQVhPOztBQWFmOzs7QUFHQUMsU0FBSyxlQUFVO0FBQ2IsYUFBT04sRUFBRSxNQUFGLEVBQVVPLElBQVYsQ0FBZSxLQUFmLE1BQTBCLEtBQWpDO0FBQ0QsS0FsQmM7QUFtQmY7Ozs7QUFJQUMs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LFFBQUYsRUFBWStKLEVBQVosQ0FBZSxrQkFBZixFQUFtQyxlQUFuQyxFQUFvRCxZQUFZO0FBQzVEdWhCLGtCQUFVQyxHQUFWLEVBQWUsU0FBZixFQUEwQixrQkFBMUI7QUFDQW53QixVQUFFLFlBQUYsRUFBZ0IwUSxPQUFoQixDQUF3QjtBQUNwQmdWLHVCQUFXN2E7QUFEUyxTQUF4QixFQUVHLE1BRkg7QUFHSCxLQUxEO0FBTUgsQ0FyQkQsRUFxQkdqQyxNQXJCSCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjIuNCc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBldGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYoL3RydWUvLnRlc3Qoc3RyKSkgcmV0dXJuIHRydWU7XG4gIGVsc2UgaWYoL2ZhbHNlLy50ZXN0KHN0cikpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XG4gIHJldHVybiBzdHI7XG59XG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5Gb3VuZGF0aW9uLkJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcbiAgR2V0T2Zmc2V0czogR2V0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0O1xuXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoICsgcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgKyBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0KTtcbiAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKTtcbiAgfVxuXG4gIHZhciBhbGxEaXJzID0gW2JvdHRvbSwgdG9wLCBsZWZ0LCByaWdodF07XG5cbiAgaWYgKGxyT25seSkge1xuICAgIHJldHVybiBsZWZ0ID09PSByaWdodCA9PT0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0Yk9ubHkpIHtcbiAgICByZXR1cm4gdG9wID09PSBib3R0b20gPT09IHRydWU7XG4gIH1cblxuICByZXR1cm4gYWxsRGlycy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XG59O1xuXG4vKipcbiAqIFVzZXMgbmF0aXZlIG1ldGhvZHMgdG8gcmV0dXJuIGFuIG9iamVjdCBvZiBkaW1lbnNpb24gdmFsdWVzLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeSB8fCBIVE1MfSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBvciBET00gZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBkaW1lbnNpb25zLiBDYW4gYmUgYW55IGVsZW1lbnQgb3RoZXIgdGhhdCBkb2N1bWVudCBvciB3aW5kb3cuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG5lc3RlZCBvYmplY3Qgb2YgaW50ZWdlciBwaXhlbCB2YWx1ZXNcbiAqIFRPRE8gLSBpZiBlbGVtZW50IGlzIHdpbmRvdywgcmV0dXJuIG9ubHkgdGhvc2UgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBHZXREaW1lbnNpb25zKGVsZW0sIHRlc3Qpe1xuICBlbGVtID0gZWxlbS5sZW5ndGggPyBlbGVtWzBdIDogZWxlbTtcblxuICBpZiAoZWxlbSA9PT0gd2luZG93IHx8IGVsZW0gPT09IGRvY3VtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSSdtIHNvcnJ5LCBEYXZlLiBJJ20gYWZyYWlkIEkgY2FuJ3QgZG8gdGhhdC5cIik7XG4gIH1cblxuICB2YXIgcmVjdCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICBwYXJSZWN0ID0gZWxlbS5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgd2luUmVjdCA9IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5ZID0gd2luZG93LnBhZ2VZT2Zmc2V0LFxuICAgICAgd2luWCA9IHdpbmRvdy5wYWdlWE9mZnNldDtcblxuICByZXR1cm4ge1xuICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXG4gICAgb2Zmc2V0OiB7XG4gICAgICB0b3A6IHJlY3QudG9wICsgd2luWSxcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHdpblhcbiAgICB9LFxuICAgIHBhcmVudERpbXM6IHtcbiAgICAgIHdpZHRoOiBwYXJSZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiBwYXJSZWN0LmhlaWdodCxcbiAgICAgIG9mZnNldDoge1xuICAgICAgICB0b3A6IHBhclJlY3QudG9wICsgd2luWSxcbiAgICAgICAgbGVmdDogcGFyUmVjdC5sZWZ0ICsgd2luWFxuICAgICAgfVxuICAgIH0sXG4gICAgd2luZG93RGltczoge1xuICAgICAgd2lkdGg6IHdpblJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHdpblJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogd2luWSxcbiAgICAgICAgbGVmdDogd2luWFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gb2JqZWN0IG9mIHRvcCBhbmQgbGVmdCBpbnRlZ2VyIHBpeGVsIHZhbHVlcyBmb3IgZHluYW1pY2FsbHkgcmVuZGVyZWQgZWxlbWVudHMsXG4gKiBzdWNoIGFzOiBUb29sdGlwLCBSZXZlYWwsIGFuZCBEcm9wZG93blxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHBvc2l0aW9uZWQuXG4gKiBAcGFyYW0ge2pRdWVyeX0gYW5jaG9yIC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQncyBhbmNob3IgcG9pbnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gcG9zaXRpb24gLSBhIHN0cmluZyByZWxhdGluZyB0byB0aGUgZGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCwgcmVsYXRpdmUgdG8gaXQncyBhbmNob3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB2T2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIHZlcnRpY2FsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0gaE9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCBob3Jpem9udGFsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzT3ZlcmZsb3cgLSBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZCwgc2V0cyB0byB0cnVlIHRvIGRlZmF1bHQgdGhlIGVsZW1lbnQgdG8gZnVsbCB3aWR0aCAtIGFueSBkZXNpcmVkIG9mZnNldC5cbiAqIFRPRE8gYWx0ZXIvcmV3cml0ZSB0byB3b3JrIHdpdGggYGVtYCB2YWx1ZXMgYXMgd2VsbC9pbnN0ZWFkIG9mIHBpeGVsc1xuICovXG5mdW5jdGlvbiBHZXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgcG9zaXRpb24sIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpIHtcbiAgdmFyICRlbGVEaW1zID0gR2V0RGltZW5zaW9ucyhlbGVtZW50KSxcbiAgICAgICRhbmNob3JEaW1zID0gYW5jaG9yID8gR2V0RGltZW5zaW9ucyhhbmNob3IpIDogbnVsbDtcblxuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgY2FzZSAndG9wJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgdG9wJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICgkYW5jaG9yRGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogaXNPdmVyZmxvdyA/IGhPZmZzZXQgOiAoKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMikpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIHJpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0ICsgMSxcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCArICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArICgkZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmV2ZWFsJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC0gJGVsZURpbXMud2lkdGgpIC8gMixcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyB2T2Zmc2V0XG4gICAgICB9XG4gICAgY2FzZSAncmV2ZWFsIGZ1bGwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCxcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgLSAkZWxlRGltcy53aWR0aCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0XG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICB9XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcbiAqIFBsZWFzZSB0aGFuayBNYXJpdXMgb24gR2l0SHViIC9vd2xiZXJ0eiAqXG4gKiBvciB0aGUgd2ViIGh0dHA6Ly93d3cubWFyaXVzb2xiZXJ0ei5kZS8gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3Qga2V5Q29kZXMgPSB7XG4gIDk6ICdUQUInLFxuICAxMzogJ0VOVEVSJyxcbiAgMjc6ICdFU0NBUEUnLFxuICAzMjogJ1NQQUNFJyxcbiAgMzc6ICdBUlJPV19MRUZUJyxcbiAgMzg6ICdBUlJPV19VUCcsXG4gIDM5OiAnQVJST1dfUklHSFQnLFxuICA0MDogJ0FSUk9XX0RPV04nXG59XG5cbnZhciBjb21tYW5kcyA9IHt9XG5cbnZhciBLZXlib2FyZCA9IHtcbiAga2V5czogZ2V0S2V5Q29kZXMoa2V5Q29kZXMpLFxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcbiAgICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxuICAgKi9cbiAgcGFyc2VLZXkoZXZlbnQpIHtcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSBrZXkgPSBgQ1RSTF8ke2tleX1gO1xuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcbiAgICByZXR1cm4ga2V5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSBnaXZlbiAoa2V5Ym9hcmQpIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQncyBuYW1lLCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHBhcmFtIHtPYmplY3RzfSBmdW5jdGlvbnMgLSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBleGVjdXRlZFxuICAgKi9cbiAgaGFuZGxlS2V5KGV2ZW50LCBjb21wb25lbnQsIGZ1bmN0aW9ucykge1xuICAgIHZhciBjb21tYW5kTGlzdCA9IGNvbW1hbmRzW2NvbXBvbmVudF0sXG4gICAgICBrZXlDb2RlID0gdGhpcy5wYXJzZUtleShldmVudCksXG4gICAgICBjbWRzLFxuICAgICAgY29tbWFuZCxcbiAgICAgIGZuO1xuXG4gICAgaWYgKCFjb21tYW5kTGlzdCkgcmV0dXJuIGNvbnNvbGUud2FybignQ29tcG9uZW50IG5vdCBkZWZpbmVkIScpO1xuXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kTGlzdC5sdHIgPT09ICd1bmRlZmluZWQnKSB7IC8vIHRoaXMgY29tcG9uZW50IGRvZXMgbm90IGRpZmZlcmVudGlhdGUgYmV0d2VlbiBsdHIgYW5kIHJ0bFxuICAgICAgICBjbWRzID0gY29tbWFuZExpc3Q7IC8vIHVzZSBwbGFpbiBsaXN0XG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcblxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xuICAgIH1cbiAgICBjb21tYW5kID0gY21kc1trZXlDb2RlXTtcblxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiAgaWYgZXhpc3RzXG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSBmbi5hcHBseSgpO1xuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMuaGFuZGxlZChyZXR1cm5WYWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBuYW1lIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxuICAgKi9cblxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XG4gICAgY29tbWFuZHNbY29tcG9uZW50TmFtZV0gPSBjbWRzO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgaWYobmFtZWRRdWVyaWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgZ2V0KHNpemUpIHtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xuICAgICAgaWYodGhpcy5xdWVyaWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcbiAgICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxuICAgKi9cbiAgX2dldEN1cnJlbnRTaXplKCkge1xuICAgIHZhciBtYXRjaGVkO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcblxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKSwgY3VycmVudFNpemUgPSB0aGlzLmN1cnJlbnQ7XG5cbiAgICAgIGlmIChuZXdTaXplICE9PSBjdXJyZW50U2l6ZSkge1xuICAgICAgICAvLyBDaGFuZ2UgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnlcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3U2l6ZTtcblxuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBbbmV3U2l6ZSwgY3VycmVudFNpemVdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxuLy8gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2VcbndpbmRvdy5tYXRjaE1lZGlhIHx8ICh3aW5kb3cubWF0Y2hNZWRpYSA9IGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRm9yIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBtYXRjaE1lZGl1bSBhcGkgc3VjaCBhcyBJRSA5IGFuZCB3ZWJraXRcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcblxuICAvLyBGb3IgdGhvc2UgdGhhdCBkb24ndCBzdXBwb3J0IG1hdGNoTWVkaXVtXG4gIGlmICghc3R5bGVNZWRpYSkge1xuICAgIHZhciBzdHlsZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcbiAgICBzY3JpcHQgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXSxcbiAgICBpbmZvICAgICAgICA9IG51bGw7XG5cbiAgICBzdHlsZS50eXBlICA9ICd0ZXh0L2Nzcyc7XG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xuXG4gICAgc2NyaXB0ICYmIHNjcmlwdC5wYXJlbnROb2RlICYmIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSgpKTtcblxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcblxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xuXG4gIGlmICghc3RyKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcblxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSwge30pO1xuXG4gIHJldHVybiBzdHlsZU9iamVjdDtcbn1cblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnUuZmluZCgnYTpmaXJzdCcpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG5cbiAgICBpdGVtcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG5cbiAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xuICAgICAgICAkaXRlbVxuICAgICAgICAgIC5hZGRDbGFzcyhoYXNTdWJDbGFzcylcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICRzdWJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoYGlzLXN1Ym1lbnUtaXRlbSAke3N1Ykl0ZW1DbGFzc31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybjtcbiAgfSxcblxuICBCdXJuKG1lbnUsIHR5cGUpIHtcbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudVxuICAgICAgLmZpbmQoJz5saSwgLm1lbnUsIC5tZW51ID4gbGknKVxuICAgICAgLnJlbW92ZUNsYXNzKGAke3N1Yk1lbnVDbGFzc30gJHtzdWJJdGVtQ2xhc3N9ICR7aGFzU3ViQ2xhc3N9IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51IGlzLWFjdGl2ZWApXG4gICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykuY3NzKCdkaXNwbGF5JywgJycpO1xuXG4gICAgLy8gY29uc29sZS5sb2coICAgICAgbWVudS5maW5kKCcuJyArIHN1Yk1lbnVDbGFzcyArICcsIC4nICsgc3ViSXRlbUNsYXNzICsgJywgLmhhcy1zdWJtZW51LCAuaXMtc3VibWVudS1pdGVtLCAuc3VibWVudSwgW2RhdGEtc3VibWVudV0nKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKSk7XG4gICAgLy8gaXRlbXMuZWFjaChmdW5jdGlvbigpe1xuICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAvLyAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG4gICAgLy8gICBpZigkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGlmKCRzdWIubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XG4gICAgLy8gICAgICRzdWIucmVtb3ZlQ2xhc3MoJ3N1Ym1lbnUgJyArIHN1Yk1lbnVDbGFzcykucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51Jyk7XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5OZXN0ID0gTmVzdDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5mdW5jdGlvbiBUaW1lcihlbGVtLCBvcHRpb25zLCBjYikge1xuICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZHVyYXRpb24gPSBvcHRpb25zLmR1cmF0aW9uLC8vb3B0aW9ucyBpcyBhbiBvYmplY3QgZm9yIGVhc2lseSBhZGRpbmcgZmVhdHVyZXMgbGF0ZXIuXG4gICAgICBuYW1lU3BhY2UgPSBPYmplY3Qua2V5cyhlbGVtLmRhdGEoKSlbMF0gfHwgJ3RpbWVyJyxcbiAgICAgIHJlbWFpbiA9IC0xLFxuICAgICAgc3RhcnQsXG4gICAgICB0aW1lcjtcblxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG5cbiAgdGhpcy5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmVtYWluID0gLTE7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLnN0YXJ0KCk7XG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIC8vIGlmKCFlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgcmVtYWluID0gcmVtYWluIDw9IDAgPyBkdXJhdGlvbiA6IHJlbWFpbjtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIGZhbHNlKTtcbiAgICBzdGFydCA9IERhdGUubm93KCk7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihvcHRpb25zLmluZmluaXRlKXtcbiAgICAgICAgX3RoaXMucmVzdGFydCgpOy8vcmVydW4gdGhlIHRpbWVyLlxuICAgICAgfVxuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgeyBjYigpOyB9XG4gICAgfSwgcmVtYWluKTtcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVyc3RhcnQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cblxuICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgLy9pZihlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCB0cnVlKTtcbiAgICB2YXIgZW5kID0gRGF0ZS5ub3coKTtcbiAgICByZW1haW4gPSByZW1haW4gLSAoZW5kIC0gc3RhcnQpO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJwYXVzZWQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBpbWFnZXMgYXJlIGZ1bGx5IGxvYWRlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbWFnZXMgLSBJbWFnZShzKSB0byBjaGVjayBpZiBsb2FkZWQuXG4gKiBAcGFyYW0ge0Z1bmN9IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGltYWdlIGlzIGZ1bGx5IGxvYWRlZC5cbiAqL1xuZnVuY3Rpb24gb25JbWFnZXNMb2FkZWQoaW1hZ2VzLCBjYWxsYmFjayl7XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIHVubG9hZGVkID0gaW1hZ2VzLmxlbmd0aDtcblxuICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICBjYWxsYmFjaygpO1xuICB9XG5cbiAgaW1hZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY29tcGxldGUpIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLm5hdHVyYWxXaWR0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5uYXR1cmFsV2lkdGggPiAwKSB7XG4gICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQodGhpcykub25lKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNpbmdsZUltYWdlTG9hZGVkKCkge1xuICAgIHVubG9hZGVkLS07XG4gICAgaWYgKHVubG9hZGVkID09PSAwKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxufVxuXG5Gb3VuZGF0aW9uLlRpbWVyID0gVGltZXI7XG5Gb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkID0gb25JbWFnZXNMb2FkZWQ7XG5cbn0oalF1ZXJ5KTtcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipXb3JrIGluc3BpcmVkIGJ5IG11bHRpcGxlIGpxdWVyeSBzd2lwZSBwbHVnaW5zKipcbi8vKipEb25lIGJ5IFlvaGFpIEFyYXJhdCAqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbihmdW5jdGlvbigkKSB7XG5cbiAgJC5zcG90U3dpcGUgPSB7XG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBlbmFibGVkOiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgcHJldmVudERlZmF1bHQ6IGZhbHNlLFxuICAgIG1vdmVUaHJlc2hvbGQ6IDc1LFxuICAgIHRpbWVUaHJlc2hvbGQ6IDIwMFxuICB9O1xuXG4gIHZhciAgIHN0YXJ0UG9zWCxcbiAgICAgICAgc3RhcnRQb3NZLFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVsYXBzZWRUaW1lLFxuICAgICAgICBpc01vdmluZyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XG4gICAgLy8gIGFsZXJ0KHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcbiAgICBpc01vdmluZyA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgIGlmICgkLnNwb3RTd2lwZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cbiAgICBpZihpc01vdmluZykge1xuICAgICAgdmFyIHggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICB2YXIgeSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIHZhciBkeCA9IHN0YXJ0UG9zWCAtIHg7XG4gICAgICB2YXIgZHkgPSBzdGFydFBvc1kgLSB5O1xuICAgICAgdmFyIGRpcjtcbiAgICAgIGVsYXBzZWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XG4gICAgICBpZihNYXRoLmFicyhkeCkgPj0gJC5zcG90U3dpcGUubW92ZVRocmVzaG9sZCAmJiBlbGFwc2VkVGltZSA8PSAkLnNwb3RTd2lwZS50aW1lVGhyZXNob2xkKSB7XG4gICAgICAgIGRpciA9IGR4ID4gMCA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGlmKE1hdGguYWJzKGR5KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgIC8vICAgZGlyID0gZHkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgIC8vIH1cbiAgICAgIGlmKGRpcikge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG9uVG91Y2hFbmQuY2FsbCh0aGlzKTtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdzd2lwZScsIGRpcikudHJpZ2dlcihgc3dpcGUke2Rpcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoU3RhcnQoZSkge1xuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHN0YXJ0UG9zWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHN0YXJ0UG9zWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIGlzTW92aW5nID0gdHJ1ZTtcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciAmJiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCk7XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7IHNldHVwOiBpbml0IH07XG5cbiAgJC5lYWNoKFsnbGVmdCcsICd1cCcsICdkb3duJywgJ3JpZ2h0J10sIGZ1bmN0aW9uICgpIHtcbiAgICAkLmV2ZW50LnNwZWNpYWxbYHN3aXBlJHt0aGlzfWBdID0geyBzZXR1cDogZnVuY3Rpb24oKXtcbiAgICAgICQodGhpcykub24oJ3N3aXBlJywgJC5ub29wKTtcbiAgICB9IH07XG4gIH0pO1xufSkoalF1ZXJ5KTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNZXRob2QgZm9yIGFkZGluZyBwc3VlZG8gZHJhZyBldmVudHMgdG8gZWxlbWVudHMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbiFmdW5jdGlvbigkKXtcbiAgJC5mbi5hZGRUb3VjaCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksZWwpe1xuICAgICAgJChlbCkuYmluZCgndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnLGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vd2UgcGFzcyB0aGUgb3JpZ2luYWwgZXZlbnQgb2JqZWN0IGJlY2F1c2UgdGhlIGpRdWVyeSBldmVudFxuICAgICAgICAvL29iamVjdCBpcyBub3JtYWxpemVkIHRvIHczYyBzcGVjcyBhbmQgZG9lcyBub3QgcHJvdmlkZSB0aGUgVG91Y2hMaXN0XG4gICAgICAgIGhhbmRsZVRvdWNoKGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhbmRsZVRvdWNoID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyxcbiAgICAgICAgICBmaXJzdCA9IHRvdWNoZXNbMF0sXG4gICAgICAgICAgZXZlbnRUeXBlcyA9IHtcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6ICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgdG91Y2htb3ZlOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgIHRvdWNoZW5kOiAnbW91c2V1cCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR5cGUgPSBldmVudFR5cGVzW2V2ZW50LnR5cGVdLFxuICAgICAgICAgIHNpbXVsYXRlZEV2ZW50XG4gICAgICAgIDtcblxuICAgICAgaWYoJ01vdXNlRXZlbnQnIGluIHdpbmRvdyAmJiB0eXBlb2Ygd2luZG93Lk1vdXNlRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBuZXcgd2luZG93Lk1vdXNlRXZlbnQodHlwZSwge1xuICAgICAgICAgICdidWJibGVzJzogdHJ1ZSxcbiAgICAgICAgICAnY2FuY2VsYWJsZSc6IHRydWUsXG4gICAgICAgICAgJ3NjcmVlblgnOiBmaXJzdC5zY3JlZW5YLFxuICAgICAgICAgICdzY3JlZW5ZJzogZmlyc3Quc2NyZWVuWSxcbiAgICAgICAgICAnY2xpZW50WCc6IGZpcnN0LmNsaWVudFgsXG4gICAgICAgICAgJ2NsaWVudFknOiBmaXJzdC5jbGllbnRZXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xuICAgICAgICBzaW11bGF0ZWRFdmVudC5pbml0TW91c2VFdmVudCh0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIGZpcnN0LnNjcmVlblgsIGZpcnN0LnNjcmVlblksIGZpcnN0LmNsaWVudFgsIGZpcnN0LmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLypsZWZ0Ki8sIG51bGwpO1xuICAgICAgfVxuICAgICAgZmlyc3QudGFyZ2V0LmRpc3BhdGNoRXZlbnQoc2ltdWxhdGVkRXZlbnQpO1xuICAgIH07XG4gIH07XG59KGpRdWVyeSk7XG5cblxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vLyoqRnJvbSB0aGUgalF1ZXJ5IE1vYmlsZSBMaWJyYXJ5Kipcbi8vKipuZWVkIHRvIHJlY3JlYXRlIGZ1bmN0aW9uYWxpdHkqKlxuLy8qKmFuZCB0cnkgdG8gaW1wcm92ZSBpZiBwb3NzaWJsZSoqXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuLyogUmVtb3ZpbmcgdGhlIGpRdWVyeSBmdW5jdGlvbiAqKioqXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuKGZ1bmN0aW9uKCAkLCB3aW5kb3csIHVuZGVmaW5lZCApIHtcblxuXHR2YXIgJGRvY3VtZW50ID0gJCggZG9jdW1lbnQgKSxcblx0XHQvLyBzdXBwb3J0VG91Y2ggPSAkLm1vYmlsZS5zdXBwb3J0LnRvdWNoLFxuXHRcdHRvdWNoU3RhcnRFdmVudCA9ICd0b3VjaHN0YXJ0Jy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaHN0YXJ0XCIgOiBcIm1vdXNlZG93blwiLFxuXHRcdHRvdWNoU3RvcEV2ZW50ID0gJ3RvdWNoZW5kJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaGVuZFwiIDogXCJtb3VzZXVwXCIsXG5cdFx0dG91Y2hNb3ZlRXZlbnQgPSAndG91Y2htb3ZlJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaG1vdmVcIiA6IFwibW91c2Vtb3ZlXCI7XG5cblx0Ly8gc2V0dXAgbmV3IGV2ZW50IHNob3J0Y3V0c1xuXHQkLmVhY2goICggXCJ0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCBcIiArXG5cdFx0XCJzd2lwZSBzd2lwZWxlZnQgc3dpcGVyaWdodFwiICkuc3BsaXQoIFwiIFwiICksIGZ1bmN0aW9uKCBpLCBuYW1lICkge1xuXG5cdFx0JC5mblsgbmFtZSBdID0gZnVuY3Rpb24oIGZuICkge1xuXHRcdFx0cmV0dXJuIGZuID8gdGhpcy5iaW5kKCBuYW1lLCBmbiApIDogdGhpcy50cmlnZ2VyKCBuYW1lICk7XG5cdFx0fTtcblxuXHRcdC8vIGpRdWVyeSA8IDEuOFxuXHRcdGlmICggJC5hdHRyRm4gKSB7XG5cdFx0XHQkLmF0dHJGblsgbmFtZSBdID0gdHJ1ZTtcblx0XHR9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIHRyaWdnZXJDdXN0b21FdmVudCggb2JqLCBldmVudFR5cGUsIGV2ZW50LCBidWJibGUgKSB7XG5cdFx0dmFyIG9yaWdpbmFsVHlwZSA9IGV2ZW50LnR5cGU7XG5cdFx0ZXZlbnQudHlwZSA9IGV2ZW50VHlwZTtcblx0XHRpZiAoIGJ1YmJsZSApIHtcblx0XHRcdCQuZXZlbnQudHJpZ2dlciggZXZlbnQsIHVuZGVmaW5lZCwgb2JqICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQuZXZlbnQuZGlzcGF0Y2guY2FsbCggb2JqLCBldmVudCApO1xuXHRcdH1cblx0XHRldmVudC50eXBlID0gb3JpZ2luYWxUeXBlO1xuXHR9XG5cblx0Ly8gYWxzbyBoYW5kbGVzIHRhcGhvbGRcblxuXHQvLyBBbHNvIGhhbmRsZXMgc3dpcGVsZWZ0LCBzd2lwZXJpZ2h0XG5cdCQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHtcblxuXHRcdC8vIE1vcmUgdGhhbiB0aGlzIGhvcml6b250YWwgZGlzcGxhY2VtZW50LCBhbmQgd2Ugd2lsbCBzdXBwcmVzcyBzY3JvbGxpbmcuXG5cdFx0c2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZDogMzAsXG5cblx0XHQvLyBNb3JlIHRpbWUgdGhhbiB0aGlzLCBhbmQgaXQgaXNuJ3QgYSBzd2lwZS5cblx0XHRkdXJhdGlvblRocmVzaG9sZDogMTAwMCxcblxuXHRcdC8vIFN3aXBlIGhvcml6b250YWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbW9yZSB0aGFuIHRoaXMuXG5cdFx0aG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcblxuXHRcdC8vIFN3aXBlIHZlcnRpY2FsIGRpc3BsYWNlbWVudCBtdXN0IGJlIGxlc3MgdGhhbiB0aGlzLlxuXHRcdHZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Z2V0TG9jYXRpb246IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0XHR2YXIgd2luUGFnZVggPSB3aW5kb3cucGFnZVhPZmZzZXQsXG5cdFx0XHRcdHdpblBhZ2VZID0gd2luZG93LnBhZ2VZT2Zmc2V0LFxuXHRcdFx0XHR4ID0gZXZlbnQuY2xpZW50WCxcblx0XHRcdFx0eSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdGlmICggZXZlbnQucGFnZVkgPT09IDAgJiYgTWF0aC5mbG9vciggeSApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVkgKSB8fFxuXHRcdFx0XHRldmVudC5wYWdlWCA9PT0gMCAmJiBNYXRoLmZsb29yKCB4ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWCApICkge1xuXG5cdFx0XHRcdC8vIGlPUzQgY2xpZW50WC9jbGllbnRZIGhhdmUgdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGhhdmUgYmVlblxuXHRcdFx0XHQvLyBpbiBwYWdlWC9wYWdlWS4gV2hpbGUgcGFnZVgvcGFnZS8gaGF2ZSB0aGUgdmFsdWUgMFxuXHRcdFx0XHR4ID0geCAtIHdpblBhZ2VYO1xuXHRcdFx0XHR5ID0geSAtIHdpblBhZ2VZO1xuXHRcdFx0fSBlbHNlIGlmICggeSA8ICggZXZlbnQucGFnZVkgLSB3aW5QYWdlWSkgfHwgeCA8ICggZXZlbnQucGFnZVggLSB3aW5QYWdlWCApICkge1xuXG5cdFx0XHRcdC8vIFNvbWUgQW5kcm9pZCBicm93c2VycyBoYXZlIHRvdGFsbHkgYm9ndXMgdmFsdWVzIGZvciBjbGllbnRYL1lcblx0XHRcdFx0Ly8gd2hlbiBzY3JvbGxpbmcvem9vbWluZyBhIHBhZ2UuIERldGVjdGFibGUgc2luY2UgY2xpZW50WC9jbGllbnRZXG5cdFx0XHRcdC8vIHNob3VsZCBuZXZlciBiZSBzbWFsbGVyIHRoYW4gcGFnZVgvcGFnZVkgbWludXMgcGFnZSBzY3JvbGxcblx0XHRcdFx0eCA9IGV2ZW50LnBhZ2VYIC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSBldmVudC5wYWdlWSAtIHdpblBhZ2VZO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRzdGFydDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGRhdGEgPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgP1xuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXSxcblx0XHRcdFx0XHRcdG9yaWdpbjogJCggZXZlbnQudGFyZ2V0IClcblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRzdG9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdXG5cdFx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0aGFuZGxlU3dpcGU6IGZ1bmN0aW9uKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApIHtcblx0XHRcdGlmICggc3RvcC50aW1lIC0gc3RhcnQudGltZSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5kdXJhdGlvblRocmVzaG9sZCAmJlxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDEgXSAtIHN0b3AuY29vcmRzWyAxIF0gKSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS52ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkICkge1xuXHRcdFx0XHR2YXIgZGlyZWN0aW9uID0gc3RhcnQuY29vcmRzWzBdID4gc3RvcC5jb29yZHNbIDAgXSA/IFwic3dpcGVsZWZ0XCIgOiBcInN3aXBlcmlnaHRcIjtcblxuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIFwic3dpcGVcIiwgJC5FdmVudCggXCJzd2lwZVwiLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9KSwgdHJ1ZSApO1xuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIGRpcmVjdGlvbiwkLkV2ZW50KCBkaXJlY3Rpb24sIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0gKSwgdHJ1ZSApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdH0sXG5cblx0XHQvLyBUaGlzIHNlcnZlcyBhcyBhIGZsYWcgdG8gZW5zdXJlIHRoYXQgYXQgbW9zdCBvbmUgc3dpcGUgZXZlbnQgZXZlbnQgaXNcblx0XHQvLyBpbiB3b3JrIGF0IGFueSBnaXZlbiB0aW1lXG5cdFx0ZXZlbnRJblByb2dyZXNzOiBmYWxzZSxcblxuXHRcdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsXG5cdFx0XHRcdHRoaXNPYmplY3QgPSB0aGlzLFxuXHRcdFx0XHQkdGhpcyA9ICQoIHRoaXNPYmplY3QgKSxcblx0XHRcdFx0Y29udGV4dCA9IHt9O1xuXG5cdFx0XHQvLyBSZXRyaWV2ZSB0aGUgZXZlbnRzIGRhdGEgZm9yIHRoaXMgZWxlbWVudCBhbmQgYWRkIHRoZSBzd2lwZSBjb250ZXh0XG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRpZiAoICFldmVudHMgKSB7XG5cdFx0XHRcdGV2ZW50cyA9IHsgbGVuZ3RoOiAwIH07XG5cdFx0XHRcdCQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIsIGV2ZW50cyApO1xuXHRcdFx0fVxuXHRcdFx0ZXZlbnRzLmxlbmd0aCsrO1xuXHRcdFx0ZXZlbnRzLnN3aXBlID0gY29udGV4dDtcblxuXHRcdFx0Y29udGV4dC5zdGFydCA9IGZ1bmN0aW9uKCBldmVudCApIHtcblxuXHRcdFx0XHQvLyBCYWlsIGlmIHdlJ3JlIGFscmVhZHkgd29ya2luZyBvbiBhIHN3aXBlIGV2ZW50XG5cdFx0XHRcdGlmICggJC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IHRydWU7XG5cblx0XHRcdFx0dmFyIHN0b3AsXG5cdFx0XHRcdFx0c3RhcnQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RhcnQoIGV2ZW50ICksXG5cdFx0XHRcdFx0b3JpZ1RhcmdldCA9IGV2ZW50LnRhcmdldCxcblx0XHRcdFx0XHRlbWl0dGVkID0gZmFsc2U7XG5cblx0XHRcdFx0Y29udGV4dC5tb3ZlID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRcdGlmICggIXN0YXJ0IHx8IGV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0b3AgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RvcCggZXZlbnQgKTtcblx0XHRcdFx0XHRpZiAoICFlbWl0dGVkICkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5oYW5kbGVTd2lwZSggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKTtcblx0XHRcdFx0XHRcdGlmICggZW1pdHRlZCApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcblx0XHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBwcmV2ZW50IHNjcm9sbGluZ1xuXHRcdFx0XHRcdGlmICggTWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnNjcm9sbFN1cHJlc3Npb25UaHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRjb250ZXh0LnN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcblx0XHRcdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcblx0XHRcdFx0XHRcdGNvbnRleHQubW92ZSA9IG51bGw7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JGRvY3VtZW50Lm9uKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlIClcblx0XHRcdFx0XHQub25lKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XG5cdFx0XHR9O1xuXHRcdFx0JHRoaXMub24oIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xuXHRcdH0sXG5cblx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXZlbnRzLCBjb250ZXh0O1xuXG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRpZiAoIGV2ZW50cyApIHtcblx0XHRcdFx0Y29udGV4dCA9IGV2ZW50cy5zd2lwZTtcblx0XHRcdFx0ZGVsZXRlIGV2ZW50cy5zd2lwZTtcblx0XHRcdFx0ZXZlbnRzLmxlbmd0aC0tO1xuXHRcdFx0XHRpZiAoIGV2ZW50cy5sZW5ndGggPT09IDAgKSB7XG5cdFx0XHRcdFx0JC5yZW1vdmVEYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggY29udGV4dCApIHtcblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0YXJ0ICkge1xuXHRcdFx0XHRcdCQoIHRoaXMgKS5vZmYoIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5tb3ZlICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RvcCApIHtcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdCQuZWFjaCh7XG5cdFx0c3dpcGVsZWZ0OiBcInN3aXBlLmxlZnRcIixcblx0XHRzd2lwZXJpZ2h0OiBcInN3aXBlLnJpZ2h0XCJcblx0fSwgZnVuY3Rpb24oIGV2ZW50LCBzb3VyY2VFdmVudCApIHtcblxuXHRcdCQuZXZlbnQuc3BlY2lhbFsgZXZlbnQgXSA9IHtcblx0XHRcdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLmJpbmQoIHNvdXJjZUV2ZW50LCAkLm5vb3AgKTtcblx0XHRcdH0sXG5cdFx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQoIHRoaXMgKS51bmJpbmQoIHNvdXJjZUV2ZW50ICk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSk7XG59KSggalF1ZXJ5LCB0aGlzICk7XG4qL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XG4gIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGAke3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgIGluIHdpbmRvdykge1xuICAgICAgcmV0dXJuIHdpbmRvd1tgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYF07XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn0oKSk7XG5cbmNvbnN0IHRyaWdnZXJzID0gKGVsLCB0eXBlKSA9PiB7XG4gIGVsLmRhdGEodHlwZSkuc3BsaXQoJyAnKS5mb3JFYWNoKGlkID0+IHtcbiAgICAkKGAjJHtpZH1gKVsgdHlwZSA9PT0gJ2Nsb3NlJyA/ICd0cmlnZ2VyJyA6ICd0cmlnZ2VySGFuZGxlciddKGAke3R5cGV9LnpmLnRyaWdnZXJgLCBbZWxdKTtcbiAgfSk7XG59O1xuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1vcGVuXSB3aWxsIHJldmVhbCBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLW9wZW5dJywgZnVuY3Rpb24oKSB7XG4gIHRyaWdnZXJzKCQodGhpcyksICdvcGVuJyk7XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zZV0gd2lsbCBjbG9zZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbi8vIElmIHVzZWQgd2l0aG91dCBhIHZhbHVlIG9uIFtkYXRhLWNsb3NlXSwgdGhlIGV2ZW50IHdpbGwgYnViYmxlLCBhbGxvd2luZyBpdCB0byBjbG9zZSBhIHBhcmVudCBjb21wb25lbnQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1jbG9zZV0nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCdjbG9zZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAnY2xvc2UnKTtcbiAgfVxuICBlbHNlIHtcbiAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlLnpmLnRyaWdnZXInKTtcbiAgfVxufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtdG9nZ2xlXSB3aWxsIHRvZ2dsZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZV0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ3RvZ2dsZScpO1xufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2FibGVdIHdpbGwgcmVzcG9uZCB0byBjbG9zZS56Zi50cmlnZ2VyIGV2ZW50cy5cbiQoZG9jdW1lbnQpLm9uKCdjbG9zZS56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NhYmxlXScsIGZ1bmN0aW9uKGUpe1xuICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBsZXQgYW5pbWF0aW9uID0gJCh0aGlzKS5kYXRhKCdjbG9zYWJsZScpO1xuXG4gIGlmKGFuaW1hdGlvbiAhPT0gJycpe1xuICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoJCh0aGlzKSwgYW5pbWF0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gICAgfSk7XG4gIH1lbHNle1xuICAgICQodGhpcykuZmFkZU91dCgpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICB9XG59KTtcblxuJChkb2N1bWVudCkub24oJ2ZvY3VzLnpmLnRyaWdnZXIgYmx1ci56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZS1mb2N1c10nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUtZm9jdXMnKTtcbiAgJChgIyR7aWR9YCkudHJpZ2dlckhhbmRsZXIoJ3RvZ2dsZS56Zi50cmlnZ2VyJywgWyQodGhpcyldKTtcbn0pO1xuXG4vKipcbiogRmlyZXMgb25jZSBhZnRlciBhbGwgb3RoZXIgc2NyaXB0cyBoYXZlIGxvYWRlZFxuKiBAZnVuY3Rpb25cbiogQHByaXZhdGVcbiovXG4kKHdpbmRvdykub24oJ2xvYWQnLCAoKSA9PiB7XG4gIGNoZWNrTGlzdGVuZXJzKCk7XG59KTtcblxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcnMoKSB7XG4gIGV2ZW50c0xpc3RlbmVyKCk7XG4gIHJlc2l6ZUxpc3RlbmVyKCk7XG4gIHNjcm9sbExpc3RlbmVyKCk7XG4gIGNsb3NlbWVMaXN0ZW5lcigpO1xufVxuXG4vLyoqKioqKioqIG9ubHkgZmlyZXMgdGhpcyBmdW5jdGlvbiBvbmNlIG9uIGxvYWQsIGlmIHRoZXJlJ3Mgc29tZXRoaW5nIHRvIHdhdGNoICoqKioqKioqXG5mdW5jdGlvbiBjbG9zZW1lTGlzdGVuZXIocGx1Z2luTmFtZSkge1xuICB2YXIgeWV0aUJveGVzID0gJCgnW2RhdGEteWV0aS1ib3hdJyksXG4gICAgICBwbHVnTmFtZXMgPSBbJ2Ryb3Bkb3duJywgJ3Rvb2x0aXAnLCAncmV2ZWFsJ107XG5cbiAgaWYocGx1Z2luTmFtZSl7XG4gICAgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5wdXNoKHBsdWdpbk5hbWUpO1xuICAgIH1lbHNlIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcGx1Z2luTmFtZVswXSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLmNvbmNhdChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZXtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsdWdpbiBuYW1lcyBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gIH1cbiAgaWYoeWV0aUJveGVzLmxlbmd0aCl7XG4gICAgbGV0IGxpc3RlbmVycyA9IHBsdWdOYW1lcy5tYXAoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBgY2xvc2VtZS56Zi4ke25hbWV9YDtcbiAgICB9KS5qb2luKCcgJyk7XG5cbiAgICAkKHdpbmRvdykub2ZmKGxpc3RlbmVycykub24obGlzdGVuZXJzLCBmdW5jdGlvbihlLCBwbHVnaW5JZCl7XG4gICAgICBsZXQgcGx1Z2luID0gZS5uYW1lc3BhY2Uuc3BsaXQoJy4nKVswXTtcbiAgICAgIGxldCBwbHVnaW5zID0gJChgW2RhdGEtJHtwbHVnaW59XWApLm5vdChgW2RhdGEteWV0aS1ib3g9XCIke3BsdWdpbklkfVwiXWApO1xuXG4gICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IF90aGlzID0gJCh0aGlzKTtcblxuICAgICAgICBfdGhpcy50cmlnZ2VySGFuZGxlcignY2xvc2UuemYudHJpZ2dlcicsIFtfdGhpc10pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzaXplTGlzdGVuZXIoZGVib3VuY2Upe1xuICBsZXQgdGltZXIsXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1yZXNpemVdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS56Zi50cmlnZ2VyJylcbiAgICAub24oJ3Jlc2l6ZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cblxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSByZXNpemUgZXZlbnRcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJyZXNpemVcIik7XG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCByZXNpemUgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLnRyaWdnZXInKVxuICAgIC5vbignc2Nyb2xsLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKXtcbiAgICAgIGlmKHRpbWVyKXsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHNjcm9sbCBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInNjcm9sbFwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHNjcm9sbCBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV2ZW50c0xpc3RlbmVyKCkge1xuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxuICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZXNpemVdLCBbZGF0YS1zY3JvbGxdLCBbZGF0YS1tdXRhdGVdJyk7XG5cbiAgLy9lbGVtZW50IGNhbGxiYWNrXG4gIHZhciBsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uID0gZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzTGlzdCkge1xuICAgIHZhciAkdGFyZ2V0ID0gJChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnRhcmdldCk7XG4gICAgLy90cmlnZ2VyIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdHlwZVxuICAgIHN3aXRjaCAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikpIHtcblxuICAgICAgY2FzZSBcInJlc2l6ZVwiIDpcbiAgICAgICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldF0pO1xuICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJzY3JvbGxcIiA6XG4gICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQsIHdpbmRvdy5wYWdlWU9mZnNldF0pO1xuICAgICAgYnJlYWs7XG5cbiAgICAgIC8vIGNhc2UgXCJtdXRhdGVcIiA6XG4gICAgICAvLyBjb25zb2xlLmxvZygnbXV0YXRlJywgJHRhcmdldCk7XG4gICAgICAvLyAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdtdXRhdGUuemYudHJpZ2dlcicpO1xuICAgICAgLy9cbiAgICAgIC8vIC8vbWFrZSBzdXJlIHdlIGRvbid0IGdldCBzdHVjayBpbiBhbiBpbmZpbml0ZSBsb29wIGZyb20gc2xvcHB5IGNvZGVpbmdcbiAgICAgIC8vIGlmICgkdGFyZ2V0LmluZGV4KCdbZGF0YS1tdXRhdGVdJykgPT0gJChcIltkYXRhLW11dGF0ZV1cIikubGVuZ3RoLTEpIHtcbiAgICAgIC8vICAgZG9tTXV0YXRpb25PYnNlcnZlcigpO1xuICAgICAgLy8gfVxuICAgICAgLy8gYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQgOlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy9ub3RoaW5nXG4gICAgfVxuICB9XG5cbiAgaWYobm9kZXMubGVuZ3RoKXtcbiAgICAvL2ZvciBlYWNoIGVsZW1lbnQgdGhhdCBuZWVkcyB0byBsaXN0ZW4gZm9yIHJlc2l6aW5nLCBzY3JvbGxpbmcsIChvciBjb21pbmcgc29vbiBtdXRhdGlvbikgYWRkIGEgc2luZ2xlIG9ic2VydmVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbm9kZXMubGVuZ3RoLTE7IGkrKykge1xuICAgICAgbGV0IGVsZW1lbnRPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24pO1xuICAgICAgZWxlbWVudE9ic2VydmVyLm9ic2VydmUobm9kZXNbaV0sIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiBmYWxzZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6ZmFsc2UsIGF0dHJpYnV0ZUZpbHRlcjpbXCJkYXRhLWV2ZW50c1wiXX0pO1xuICAgIH1cbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gW1BIXVxuLy8gRm91bmRhdGlvbi5DaGVja1dhdGNoZXJzID0gY2hlY2tXYXRjaGVycztcbkZvdW5kYXRpb24uSUhlYXJZb3UgPSBjaGVja0xpc3RlbmVycztcbi8vIEZvdW5kYXRpb24uSVNlZVlvdSA9IHNjcm9sbExpc3RlbmVyO1xuLy8gRm91bmRhdGlvbi5JRmVlbFlvdSA9IGNsb3NlbWVMaXN0ZW5lcjtcblxufShqUXVlcnkpO1xuXG4vLyBmdW5jdGlvbiBkb21NdXRhdGlvbk9ic2VydmVyKGRlYm91bmNlKSB7XG4vLyAgIC8vICEhISBUaGlzIGlzIGNvbWluZyBzb29uIGFuZCBuZWVkcyBtb3JlIHdvcms7IG5vdCBhY3RpdmUgICEhISAvL1xuLy8gICB2YXIgdGltZXIsXG4vLyAgIG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbXV0YXRlXScpO1xuLy8gICAvL1xuLy8gICBpZiAobm9kZXMubGVuZ3RoKSB7XG4vLyAgICAgLy8gdmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuLy8gICAgIC8vICAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XG4vLyAgICAgLy8gICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuLy8gICAgIC8vICAgICBpZiAocHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlcicgaW4gd2luZG93KSB7XG4vLyAgICAgLy8gICAgICAgcmV0dXJuIHdpbmRvd1twcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJ107XG4vLyAgICAgLy8gICAgIH1cbi8vICAgICAvLyAgIH1cbi8vICAgICAvLyAgIHJldHVybiBmYWxzZTtcbi8vICAgICAvLyB9KCkpO1xuLy9cbi8vXG4vLyAgICAgLy9mb3IgdGhlIGJvZHksIHdlIG5lZWQgdG8gbGlzdGVuIGZvciBhbGwgY2hhbmdlcyBlZmZlY3RpbmcgdGhlIHN0eWxlIGFuZCBjbGFzcyBhdHRyaWJ1dGVzXG4vLyAgICAgdmFyIGJvZHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGJvZHlNdXRhdGlvbik7XG4vLyAgICAgYm9keU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOnRydWUsIGF0dHJpYnV0ZUZpbHRlcjpbXCJzdHlsZVwiLCBcImNsYXNzXCJdfSk7XG4vL1xuLy9cbi8vICAgICAvL2JvZHkgY2FsbGJhY2tcbi8vICAgICBmdW5jdGlvbiBib2R5TXV0YXRpb24obXV0YXRlKSB7XG4vLyAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgbXV0YXRpb24gZXZlbnRcbi8vICAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG4vL1xuLy8gICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICBib2R5T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuLy8gICAgICAgICAkKCdbZGF0YS1tdXRhdGVdJykuYXR0cignZGF0YS1ldmVudHMnLFwibXV0YXRlXCIpO1xuLy8gICAgICAgfSwgZGVib3VuY2UgfHwgMTUwKTtcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBYmlkZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uYWJpZGVcbiAqL1xuXG5jbGFzcyBBYmlkZSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEFiaWRlLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFiaWRlI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zICA9ICQuZXh0ZW5kKHt9LCBBYmlkZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnQWJpZGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgQWJpZGUgcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IEFiaWRlIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLiRpbnB1dHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0Jyk7XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEFiaWRlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLmFiaWRlJylcbiAgICAgIC5vbigncmVzZXQuemYuYWJpZGUnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVzZXRGb3JtKCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdzdWJtaXQuemYuYWJpZGUnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlRm9ybSgpO1xuICAgICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnZhbGlkYXRlT24gPT09ICdmaWVsZENoYW5nZScpIHtcbiAgICAgIHRoaXMuJGlucHV0c1xuICAgICAgICAub2ZmKCdjaGFuZ2UuemYuYWJpZGUnKVxuICAgICAgICAub24oJ2NoYW5nZS56Zi5hYmlkZScsIChlKSA9PiB7XG4gICAgICAgICAgdGhpcy52YWxpZGF0ZUlucHV0KCQoZS50YXJnZXQpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5saXZlVmFsaWRhdGUpIHtcbiAgICAgIHRoaXMuJGlucHV0c1xuICAgICAgICAub2ZmKCdpbnB1dC56Zi5hYmlkZScpXG4gICAgICAgIC5vbignaW5wdXQuemYuYWJpZGUnLCAoZSkgPT4ge1xuICAgICAgICAgIHRoaXMudmFsaWRhdGVJbnB1dCgkKGUudGFyZ2V0KSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBBYmlkZSB1cG9uIERPTSBjaGFuZ2VcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWZsb3coKSB7XG4gICAgdGhpcy5faW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCBhIGZvcm0gZWxlbWVudCBoYXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBhbmQgaWYgaXQncyBjaGVja2VkIG9yIG5vdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gY2hlY2sgZm9yIHJlcXVpcmVkIGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0dHJpYnV0ZSBpcyBjaGVja2VkIG9yIGVtcHR5XG4gICAqL1xuICByZXF1aXJlZENoZWNrKCRlbCkge1xuICAgIGlmICghJGVsLmF0dHIoJ3JlcXVpcmVkJykpIHJldHVybiB0cnVlO1xuXG4gICAgdmFyIGlzR29vZCA9IHRydWU7XG5cbiAgICBzd2l0Y2ggKCRlbFswXS50eXBlKSB7XG4gICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgIGlzR29vZCA9ICRlbFswXS5jaGVja2VkO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1vbmUnOlxuICAgICAgY2FzZSAnc2VsZWN0LW11bHRpcGxlJzpcbiAgICAgICAgdmFyIG9wdCA9ICRlbC5maW5kKCdvcHRpb246c2VsZWN0ZWQnKTtcbiAgICAgICAgaWYgKCFvcHQubGVuZ3RoIHx8ICFvcHQudmFsKCkpIGlzR29vZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYoISRlbC52YWwoKSB8fCAhJGVsLnZhbCgpLmxlbmd0aCkgaXNHb29kID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzR29vZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXNlZCBvbiAkZWwsIGdldCB0aGUgZmlyc3QgZWxlbWVudCB3aXRoIHNlbGVjdG9yIGluIHRoaXMgb3JkZXI6XG4gICAqIDEuIFRoZSBlbGVtZW50J3MgZGlyZWN0IHNpYmxpbmcoJ3MpLlxuICAgKiAzLiBUaGUgZWxlbWVudCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgKlxuICAgKiBUaGlzIGFsbG93cyBmb3IgbXVsdGlwbGUgZm9ybSBlcnJvcnMgcGVyIGlucHV0LCB0aG91Z2ggaWYgbm9uZSBhcmUgZm91bmQsIG5vIGZvcm0gZXJyb3JzIHdpbGwgYmUgc2hvd24uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBhcyByZWZlcmVuY2UgdG8gZmluZCB0aGUgZm9ybSBlcnJvciBzZWxlY3Rvci5cbiAgICogQHJldHVybnMge09iamVjdH0galF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBzZWxlY3Rvci5cbiAgICovXG4gIGZpbmRGb3JtRXJyb3IoJGVsKSB7XG4gICAgdmFyICRlcnJvciA9ICRlbC5zaWJsaW5ncyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xuXG4gICAgaWYgKCEkZXJyb3IubGVuZ3RoKSB7XG4gICAgICAkZXJyb3IgPSAkZWwucGFyZW50KCkuZmluZCh0aGlzLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiAkZXJyb3I7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBmaXJzdCBlbGVtZW50IGluIHRoaXMgb3JkZXI6XG4gICAqIDIuIFRoZSA8bGFiZWw+IHdpdGggdGhlIGF0dHJpYnV0ZSBgW2Zvcj1cInNvbWVJbnB1dElkXCJdYFxuICAgKiAzLiBUaGUgYC5jbG9zZXN0KClgIDxsYWJlbD5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gY2hlY2sgZm9yIHJlcXVpcmVkIGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0dHJpYnV0ZSBpcyBjaGVja2VkIG9yIGVtcHR5XG4gICAqL1xuICBmaW5kTGFiZWwoJGVsKSB7XG4gICAgdmFyIGlkID0gJGVsWzBdLmlkO1xuICAgIHZhciAkbGFiZWwgPSB0aGlzLiRlbGVtZW50LmZpbmQoYGxhYmVsW2Zvcj1cIiR7aWR9XCJdYCk7XG5cbiAgICBpZiAoISRsYWJlbC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAkZWwuY2xvc2VzdCgnbGFiZWwnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJGxhYmVsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc2V0IG9mIGxhYmVscyBhc3NvY2lhdGVkIHdpdGggYSBzZXQgb2YgcmFkaW8gZWxzIGluIHRoaXMgb3JkZXJcbiAgICogMi4gVGhlIDxsYWJlbD4gd2l0aCB0aGUgYXR0cmlidXRlIGBbZm9yPVwic29tZUlucHV0SWRcIl1gXG4gICAqIDMuIFRoZSBgLmNsb3Nlc3QoKWAgPGxhYmVsPlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcbiAgICovXG4gIGZpbmRSYWRpb0xhYmVscygkZWxzKSB7XG4gICAgdmFyIGxhYmVscyA9ICRlbHMubWFwKChpLCBlbCkgPT4ge1xuICAgICAgdmFyIGlkID0gZWwuaWQ7XG4gICAgICB2YXIgJGxhYmVsID0gdGhpcy4kZWxlbWVudC5maW5kKGBsYWJlbFtmb3I9XCIke2lkfVwiXWApO1xuXG4gICAgICBpZiAoISRsYWJlbC5sZW5ndGgpIHtcbiAgICAgICAgJGxhYmVsID0gJChlbCkuY2xvc2VzdCgnbGFiZWwnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAkbGFiZWxbMF07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gJChsYWJlbHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIENTUyBlcnJvciBjbGFzcyBhcyBzcGVjaWZpZWQgYnkgdGhlIEFiaWRlIHNldHRpbmdzIHRvIHRoZSBsYWJlbCwgaW5wdXQsIGFuZCB0aGUgZm9ybVxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIGNsYXNzIHRvXG4gICAqL1xuICBhZGRFcnJvckNsYXNzZXMoJGVsKSB7XG4gICAgdmFyICRsYWJlbCA9IHRoaXMuZmluZExhYmVsKCRlbCk7XG4gICAgdmFyICRmb3JtRXJyb3IgPSB0aGlzLmZpbmRGb3JtRXJyb3IoJGVsKTtcblxuICAgIGlmICgkbGFiZWwubGVuZ3RoKSB7XG4gICAgICAkbGFiZWwuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgaWYgKCRmb3JtRXJyb3IubGVuZ3RoKSB7XG4gICAgICAkZm9ybUVycm9yLmFkZENsYXNzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgJGVsLmFkZENsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLmF0dHIoJ2RhdGEtaW52YWxpZCcsICcnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgQ1NTIGVycm9yIGNsYXNzZXMgZXRjIGZyb20gYW4gZW50aXJlIHJhZGlvIGJ1dHRvbiBncm91cFxuICAgKiBAcGFyYW0ge1N0cmluZ30gZ3JvdXBOYW1lIC0gQSBzdHJpbmcgdGhhdCBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgYSByYWRpbyBidXR0b24gZ3JvdXBcbiAgICpcbiAgICovXG5cbiAgcmVtb3ZlUmFkaW9FcnJvckNsYXNzZXMoZ3JvdXBOYW1lKSB7XG4gICAgdmFyICRlbHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYDpyYWRpb1tuYW1lPVwiJHtncm91cE5hbWV9XCJdYCk7XG4gICAgdmFyICRsYWJlbHMgPSB0aGlzLmZpbmRSYWRpb0xhYmVscygkZWxzKTtcbiAgICB2YXIgJGZvcm1FcnJvcnMgPSB0aGlzLmZpbmRGb3JtRXJyb3IoJGVscyk7XG5cbiAgICBpZiAoJGxhYmVscy5sZW5ndGgpIHtcbiAgICAgICRsYWJlbHMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgaWYgKCRmb3JtRXJyb3JzLmxlbmd0aCkge1xuICAgICAgJGZvcm1FcnJvcnMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmZvcm1FcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICAkZWxzLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xuXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBDU1MgZXJyb3IgY2xhc3MgYXMgc3BlY2lmaWVkIGJ5IHRoZSBBYmlkZSBzZXR0aW5ncyBmcm9tIHRoZSBsYWJlbCwgaW5wdXQsIGFuZCB0aGUgZm9ybVxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byByZW1vdmUgdGhlIGNsYXNzIGZyb21cbiAgICovXG4gIHJlbW92ZUVycm9yQ2xhc3NlcygkZWwpIHtcbiAgICAvLyByYWRpb3MgbmVlZCB0byBjbGVhciBhbGwgb2YgdGhlIGVsc1xuICAgIGlmKCRlbFswXS50eXBlID09ICdyYWRpbycpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZVJhZGlvRXJyb3JDbGFzc2VzKCRlbC5hdHRyKCduYW1lJykpO1xuICAgIH1cblxuICAgIHZhciAkbGFiZWwgPSB0aGlzLmZpbmRMYWJlbCgkZWwpO1xuICAgIHZhciAkZm9ybUVycm9yID0gdGhpcy5maW5kRm9ybUVycm9yKCRlbCk7XG5cbiAgICBpZiAoJGxhYmVsLmxlbmd0aCkge1xuICAgICAgJGxhYmVsLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgIGlmICgkZm9ybUVycm9yLmxlbmd0aCkge1xuICAgICAgJGZvcm1FcnJvci5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgICRlbC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuaW5wdXRFcnJvckNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHb2VzIHRocm91Z2ggYSBmb3JtIHRvIGZpbmQgaW5wdXRzIGFuZCBwcm9jZWVkcyB0byB2YWxpZGF0ZSB0aGVtIGluIHdheXMgc3BlY2lmaWMgdG8gdGhlaXIgdHlwZVxuICAgKiBAZmlyZXMgQWJpZGUjaW52YWxpZFxuICAgKiBAZmlyZXMgQWJpZGUjdmFsaWRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHZhbGlkYXRlLCBzaG91bGQgYmUgYW4gSFRNTCBpbnB1dFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gZ29vZFRvR28gLSBJZiB0aGUgaW5wdXQgaXMgdmFsaWQgb3Igbm90LlxuICAgKi9cbiAgdmFsaWRhdGVJbnB1dCgkZWwpIHtcbiAgICB2YXIgY2xlYXJSZXF1aXJlID0gdGhpcy5yZXF1aXJlZENoZWNrKCRlbCksXG4gICAgICAgIHZhbGlkYXRlZCA9IGZhbHNlLFxuICAgICAgICBjdXN0b21WYWxpZGF0b3IgPSB0cnVlLFxuICAgICAgICB2YWxpZGF0b3IgPSAkZWwuYXR0cignZGF0YS12YWxpZGF0b3InKSxcbiAgICAgICAgZXF1YWxUbyA9IHRydWU7XG5cbiAgICAvLyBkb24ndCB2YWxpZGF0ZSBpZ25vcmVkIGlucHV0cyBvciBoaWRkZW4gaW5wdXRzXG4gICAgaWYgKCRlbC5pcygnW2RhdGEtYWJpZGUtaWdub3JlXScpIHx8ICRlbC5pcygnW3R5cGU9XCJoaWRkZW5cIl0nKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc3dpdGNoICgkZWxbMF0udHlwZSkge1xuICAgICAgY2FzZSAncmFkaW8nOlxuICAgICAgICB2YWxpZGF0ZWQgPSB0aGlzLnZhbGlkYXRlUmFkaW8oJGVsLmF0dHIoJ25hbWUnKSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgIHZhbGlkYXRlZCA9IGNsZWFyUmVxdWlyZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdzZWxlY3Qtb25lJzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1tdWx0aXBsZSc6XG4gICAgICAgIHZhbGlkYXRlZCA9IGNsZWFyUmVxdWlyZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhbGlkYXRlZCA9IHRoaXMudmFsaWRhdGVUZXh0KCRlbCk7XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRvcikge1xuICAgICAgY3VzdG9tVmFsaWRhdG9yID0gdGhpcy5tYXRjaFZhbGlkYXRpb24oJGVsLCB2YWxpZGF0b3IsICRlbC5hdHRyKCdyZXF1aXJlZCcpKTtcbiAgICB9XG5cbiAgICBpZiAoJGVsLmF0dHIoJ2RhdGEtZXF1YWx0bycpKSB7XG4gICAgICBlcXVhbFRvID0gdGhpcy5vcHRpb25zLnZhbGlkYXRvcnMuZXF1YWxUbygkZWwpO1xuICAgIH1cblxuXG4gICAgdmFyIGdvb2RUb0dvID0gW2NsZWFyUmVxdWlyZSwgdmFsaWRhdGVkLCBjdXN0b21WYWxpZGF0b3IsIGVxdWFsVG9dLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbiAgICB2YXIgbWVzc2FnZSA9IChnb29kVG9HbyA/ICd2YWxpZCcgOiAnaW52YWxpZCcpICsgJy56Zi5hYmlkZSc7XG5cbiAgICB0aGlzW2dvb2RUb0dvID8gJ3JlbW92ZUVycm9yQ2xhc3NlcycgOiAnYWRkRXJyb3JDbGFzc2VzJ10oJGVsKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGlucHV0IGlzIGRvbmUgY2hlY2tpbmcgZm9yIHZhbGlkYXRpb24uIEV2ZW50IHRyaWdnZXIgaXMgZWl0aGVyIGB2YWxpZC56Zi5hYmlkZWAgb3IgYGludmFsaWQuemYuYWJpZGVgXG4gICAgICogVHJpZ2dlciBpbmNsdWRlcyB0aGUgRE9NIGVsZW1lbnQgb2YgdGhlIGlucHV0LlxuICAgICAqIEBldmVudCBBYmlkZSN2YWxpZFxuICAgICAqIEBldmVudCBBYmlkZSNpbnZhbGlkXG4gICAgICovXG4gICAgJGVsLnRyaWdnZXIobWVzc2FnZSwgWyRlbF0pO1xuXG4gICAgcmV0dXJuIGdvb2RUb0dvO1xuICB9XG5cbiAgLyoqXG4gICAqIEdvZXMgdGhyb3VnaCBhIGZvcm0gYW5kIGlmIHRoZXJlIGFyZSBhbnkgaW52YWxpZCBpbnB1dHMsIGl0IHdpbGwgZGlzcGxheSB0aGUgZm9ybSBlcnJvciBlbGVtZW50XG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBub0Vycm9yIC0gdHJ1ZSBpZiBubyBlcnJvcnMgd2VyZSBkZXRlY3RlZC4uLlxuICAgKiBAZmlyZXMgQWJpZGUjZm9ybXZhbGlkXG4gICAqIEBmaXJlcyBBYmlkZSNmb3JtaW52YWxpZFxuICAgKi9cbiAgdmFsaWRhdGVGb3JtKCkge1xuICAgIHZhciBhY2MgPSBbXTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kaW5wdXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICBhY2MucHVzaChfdGhpcy52YWxpZGF0ZUlucHV0KCQodGhpcykpKTtcbiAgICB9KTtcblxuICAgIHZhciBub0Vycm9yID0gYWNjLmluZGV4T2YoZmFsc2UpID09PSAtMTtcblxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJykuY3NzKCdkaXNwbGF5JywgKG5vRXJyb3IgPyAnbm9uZScgOiAnYmxvY2snKSk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBmb3JtIGlzIGZpbmlzaGVkIHZhbGlkYXRpbmcuIEV2ZW50IHRyaWdnZXIgaXMgZWl0aGVyIGBmb3JtdmFsaWQuemYuYWJpZGVgIG9yIGBmb3JtaW52YWxpZC56Zi5hYmlkZWAuXG4gICAgICogVHJpZ2dlciBpbmNsdWRlcyB0aGUgZWxlbWVudCBvZiB0aGUgZm9ybS5cbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybXZhbGlkXG4gICAgICogQGV2ZW50IEFiaWRlI2Zvcm1pbnZhbGlkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKChub0Vycm9yID8gJ2Zvcm12YWxpZCcgOiAnZm9ybWludmFsaWQnKSArICcuemYuYWJpZGUnLCBbdGhpcy4kZWxlbWVudF0pO1xuXG4gICAgcmV0dXJuIG5vRXJyb3I7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIGEgbm90IGEgdGV4dCBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB0aGUgcGF0dGVybiBzcGVjaWZpZWQgaW4gdGhlIGF0dHJpYnV0ZS4gSWYgbm8gbWF0Y2hpbmcgcGF0dGVybiBpcyBmb3VuZCwgcmV0dXJucyB0cnVlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byB2YWxpZGF0ZSwgc2hvdWxkIGJlIGEgdGV4dCBpbnB1dCBIVE1MIGVsZW1lbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdHRlcm4gLSBzdHJpbmcgdmFsdWUgb2Ygb25lIG9mIHRoZSBSZWdFeCBwYXR0ZXJucyBpbiBBYmlkZS5vcHRpb25zLnBhdHRlcm5zXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgdGhlIGlucHV0IHZhbHVlIG1hdGNoZXMgdGhlIHBhdHRlcm4gc3BlY2lmaWVkXG4gICAqL1xuICB2YWxpZGF0ZVRleHQoJGVsLCBwYXR0ZXJuKSB7XG4gICAgLy8gQSBwYXR0ZXJuIGNhbiBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgb3IgaXQgd2lsbCBiZSBpbmZlcmVkIGZyb20gdGhlIGlucHV0J3MgXCJwYXR0ZXJuXCIgYXR0cmlidXRlLCBvciBpdCdzIFwidHlwZVwiIGF0dHJpYnV0ZVxuICAgIHBhdHRlcm4gPSAocGF0dGVybiB8fCAkZWwuYXR0cigncGF0dGVybicpIHx8ICRlbC5hdHRyKCd0eXBlJykpO1xuICAgIHZhciBpbnB1dFRleHQgPSAkZWwudmFsKCk7XG4gICAgdmFyIHZhbGlkID0gZmFsc2U7XG5cbiAgICBpZiAoaW5wdXRUZXh0Lmxlbmd0aCkge1xuICAgICAgLy8gSWYgdGhlIHBhdHRlcm4gYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50IGlzIGluIEFiaWRlJ3MgbGlzdCBvZiBwYXR0ZXJucywgdGhlbiB0ZXN0IHRoYXQgcmVnZXhwXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBhdHRlcm5zLmhhc093blByb3BlcnR5KHBhdHRlcm4pKSB7XG4gICAgICAgIHZhbGlkID0gdGhpcy5vcHRpb25zLnBhdHRlcm5zW3BhdHRlcm5dLnRlc3QoaW5wdXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZSBwYXR0ZXJuIG5hbWUgaXNuJ3QgYWxzbyB0aGUgdHlwZSBhdHRyaWJ1dGUgb2YgdGhlIGZpZWxkLCB0aGVuIHRlc3QgaXQgYXMgYSByZWdleHBcbiAgICAgIGVsc2UgaWYgKHBhdHRlcm4gIT09ICRlbC5hdHRyKCd0eXBlJykpIHtcbiAgICAgICAgdmFsaWQgPSBuZXcgUmVnRXhwKHBhdHRlcm4pLnRlc3QoaW5wdXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YWxpZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEFuIGVtcHR5IGZpZWxkIGlzIHZhbGlkIGlmIGl0J3Mgbm90IHJlcXVpcmVkXG4gICAgZWxzZSBpZiAoISRlbC5wcm9wKCdyZXF1aXJlZCcpKSB7XG4gICAgICB2YWxpZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkO1xuICAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3IgYSBub3QgYSByYWRpbyBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB3aGV0aGVyIG9yIG5vdCBpdCBpcyByZXF1aXJlZCBhbmQgc2VsZWN0ZWQuIEFsdGhvdWdoIHRoZSBmdW5jdGlvbiB0YXJnZXRzIGEgc2luZ2xlIGA8aW5wdXQ+YCwgaXQgdmFsaWRhdGVzIGJ5IGNoZWNraW5nIHRoZSBgcmVxdWlyZWRgIGFuZCBgY2hlY2tlZGAgcHJvcGVydGllcyBvZiBhbGwgcmFkaW8gYnV0dG9ucyBpbiBpdHMgZ3JvdXAuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBncm91cE5hbWUgLSBBIHN0cmluZyB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSBvZiBhIHJhZGlvIGJ1dHRvbiBncm91cFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0IGxlYXN0IG9uZSByYWRpbyBpbnB1dCBoYXMgYmVlbiBzZWxlY3RlZCAoaWYgaXQncyByZXF1aXJlZClcbiAgICovXG4gIHZhbGlkYXRlUmFkaW8oZ3JvdXBOYW1lKSB7XG4gICAgLy8gSWYgYXQgbGVhc3Qgb25lIHJhZGlvIGluIHRoZSBncm91cCBoYXMgdGhlIGByZXF1aXJlZGAgYXR0cmlidXRlLCB0aGUgZ3JvdXAgaXMgY29uc2lkZXJlZCByZXF1aXJlZFxuICAgIC8vIFBlciBXM0Mgc3BlYywgYWxsIHJhZGlvIGJ1dHRvbnMgaW4gYSBncm91cCBzaG91bGQgaGF2ZSBgcmVxdWlyZWRgLCBidXQgd2UncmUgYmVpbmcgbmljZVxuICAgIHZhciAkZ3JvdXAgPSB0aGlzLiRlbGVtZW50LmZpbmQoYDpyYWRpb1tuYW1lPVwiJHtncm91cE5hbWV9XCJdYCk7XG4gICAgdmFyIHZhbGlkID0gZmFsc2UsIHJlcXVpcmVkID0gZmFsc2U7XG5cbiAgICAvLyBGb3IgdGhlIGdyb3VwIHRvIGJlIHJlcXVpcmVkLCBhdCBsZWFzdCBvbmUgcmFkaW8gbmVlZHMgdG8gYmUgcmVxdWlyZWRcbiAgICAkZ3JvdXAuZWFjaCgoaSwgZSkgPT4ge1xuICAgICAgaWYgKCQoZSkuYXR0cigncmVxdWlyZWQnKSkge1xuICAgICAgICByZXF1aXJlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYoIXJlcXVpcmVkKSB2YWxpZD10cnVlO1xuXG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgLy8gRm9yIHRoZSBncm91cCB0byBiZSB2YWxpZCwgYXQgbGVhc3Qgb25lIHJhZGlvIG5lZWRzIHRvIGJlIGNoZWNrZWRcbiAgICAgICRncm91cC5lYWNoKChpLCBlKSA9PiB7XG4gICAgICAgIGlmICgkKGUpLnByb3AoJ2NoZWNrZWQnKSkge1xuICAgICAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB2YWxpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIGEgc2VsZWN0ZWQgaW5wdXQgcGFzc2VzIGEgY3VzdG9tIHZhbGlkYXRpb24gZnVuY3Rpb24uIE11bHRpcGxlIHZhbGlkYXRpb25zIGNhbiBiZSB1c2VkLCBpZiBwYXNzZWQgdG8gdGhlIGVsZW1lbnQgd2l0aCBgZGF0YS12YWxpZGF0b3I9XCJmb28gYmFyIGJhelwiYCBpbiBhIHNwYWNlIHNlcGFyYXRlZCBsaXN0ZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgaW5wdXQgZWxlbWVudC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHZhbGlkYXRvcnMgLSBhIHN0cmluZyBvZiBmdW5jdGlvbiBuYW1lcyBtYXRjaGluZyBmdW5jdGlvbnMgaW4gdGhlIEFiaWRlLm9wdGlvbnMudmFsaWRhdG9ycyBvYmplY3QuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVxdWlyZWQgLSBzZWxmIGV4cGxhbmF0b3J5P1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIHZhbGlkYXRpb25zIHBhc3NlZC5cbiAgICovXG4gIG1hdGNoVmFsaWRhdGlvbigkZWwsIHZhbGlkYXRvcnMsIHJlcXVpcmVkKSB7XG4gICAgcmVxdWlyZWQgPSByZXF1aXJlZCA/IHRydWUgOiBmYWxzZTtcblxuICAgIHZhciBjbGVhciA9IHZhbGlkYXRvcnMuc3BsaXQoJyAnKS5tYXAoKHYpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMudmFsaWRhdG9yc1t2XSgkZWwsIHJlcXVpcmVkLCAkZWwucGFyZW50KCkpO1xuICAgIH0pO1xuICAgIHJldHVybiBjbGVhci5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIGZvcm0gaW5wdXRzIGFuZCBzdHlsZXNcbiAgICogQGZpcmVzIEFiaWRlI2Zvcm1yZXNldFxuICAgKi9cbiAgcmVzZXRGb3JtKCkge1xuICAgIHZhciAkZm9ybSA9IHRoaXMuJGVsZW1lbnQsXG4gICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAkKGAuJHtvcHRzLmxhYmVsRXJyb3JDbGFzc31gLCAkZm9ybSkubm90KCdzbWFsbCcpLnJlbW92ZUNsYXNzKG9wdHMubGFiZWxFcnJvckNsYXNzKTtcbiAgICAkKGAuJHtvcHRzLmlucHV0RXJyb3JDbGFzc31gLCAkZm9ybSkubm90KCdzbWFsbCcpLnJlbW92ZUNsYXNzKG9wdHMuaW5wdXRFcnJvckNsYXNzKTtcbiAgICAkKGAke29wdHMuZm9ybUVycm9yU2VsZWN0b3J9LiR7b3B0cy5mb3JtRXJyb3JDbGFzc31gKS5yZW1vdmVDbGFzcyhvcHRzLmZvcm1FcnJvckNsYXNzKTtcbiAgICAkZm9ybS5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICQoJzppbnB1dCcsICRmb3JtKS5ub3QoJzpidXR0b24sIDpzdWJtaXQsIDpyZXNldCwgOmhpZGRlbiwgOnJhZGlvLCA6Y2hlY2tib3gsIFtkYXRhLWFiaWRlLWlnbm9yZV0nKS52YWwoJycpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xuICAgICQoJzppbnB1dDpyYWRpbycsICRmb3JtKS5ub3QoJ1tkYXRhLWFiaWRlLWlnbm9yZV0nKS5wcm9wKCdjaGVja2VkJyxmYWxzZSkucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XG4gICAgJCgnOmlucHV0OmNoZWNrYm94JywgJGZvcm0pLm5vdCgnW2RhdGEtYWJpZGUtaWdub3JlXScpLnByb3AoJ2NoZWNrZWQnLGZhbHNlKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBmb3JtIGhhcyBiZWVuIHJlc2V0LlxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtcmVzZXRcbiAgICAgKi9cbiAgICAkZm9ybS50cmlnZ2VyKCdmb3JtcmVzZXQuemYuYWJpZGUnLCBbJGZvcm1dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBBYmlkZS5cbiAgICogUmVtb3ZlcyBlcnJvciBzdHlsZXMgYW5kIGNsYXNzZXMgZnJvbSBlbGVtZW50cywgd2l0aG91dCByZXNldHRpbmcgdGhlaXIgdmFsdWVzLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vZmYoJy5hYmlkZScpXG4gICAgICAuZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJylcbiAgICAgICAgLmNzcygnZGlzcGxheScsICdub25lJyk7XG5cbiAgICB0aGlzLiRpbnB1dHNcbiAgICAgIC5vZmYoJy5hYmlkZScpXG4gICAgICAuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMucmVtb3ZlRXJyb3JDbGFzc2VzKCQodGhpcykpO1xuICAgICAgfSk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuQWJpZGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBldmVudCB0byB2YWxpZGF0ZSBpbnB1dHMuIENoZWNrYm94ZXMgYW5kIHJhZGlvcyB2YWxpZGF0ZSBpbW1lZGlhdGVseS5cbiAgICogUmVtb3ZlIG9yIGNoYW5nZSB0aGlzIHZhbHVlIGZvciBtYW51YWwgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZmllbGRDaGFuZ2UnXG4gICAqL1xuICB2YWxpZGF0ZU9uOiAnZmllbGRDaGFuZ2UnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0IGxhYmVscyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnaXMtaW52YWxpZC1sYWJlbCdcbiAgICovXG4gIGxhYmVsRXJyb3JDbGFzczogJ2lzLWludmFsaWQtbGFiZWwnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0cyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnaXMtaW52YWxpZC1pbnB1dCdcbiAgICovXG4gIGlucHV0RXJyb3JDbGFzczogJ2lzLWludmFsaWQtaW5wdXQnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBzZWxlY3RvciB0byB1c2UgdG8gdGFyZ2V0IEZvcm0gRXJyb3JzIGZvciBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJy5mb3JtLWVycm9yJ1xuICAgKi9cbiAgZm9ybUVycm9yU2VsZWN0b3I6ICcuZm9ybS1lcnJvcicsXG5cbiAgLyoqXG4gICAqIENsYXNzIGFkZGVkIHRvIEZvcm0gRXJyb3JzIG9uIGZhaWxlZCB2YWxpZGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdpcy12aXNpYmxlJ1xuICAgKi9cbiAgZm9ybUVycm9yQ2xhc3M6ICdpcy12aXNpYmxlJyxcblxuICAvKipcbiAgICogU2V0IHRvIHRydWUgdG8gdmFsaWRhdGUgdGV4dCBpbnB1dHMgb24gYW55IHZhbHVlIGNoYW5nZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbGl2ZVZhbGlkYXRlOiBmYWxzZSxcblxuICBwYXR0ZXJuczoge1xuICAgIGFscGhhIDogL15bYS16QS1aXSskLyxcbiAgICBhbHBoYV9udW1lcmljIDogL15bYS16QS1aMC05XSskLyxcbiAgICBpbnRlZ2VyIDogL15bLStdP1xcZCskLyxcbiAgICBudW1iZXIgOiAvXlstK10/XFxkKig/OltcXC5cXCxdXFxkKyk/JC8sXG5cbiAgICAvLyBhbWV4LCB2aXNhLCBkaW5lcnNcbiAgICBjYXJkIDogL14oPzo0WzAtOV17MTJ9KD86WzAtOV17M30pP3w1WzEtNV1bMC05XXsxNH18Nig/OjAxMXw1WzAtOV1bMC05XSlbMC05XXsxMn18M1s0N11bMC05XXsxM318Myg/OjBbMC01XXxbNjhdWzAtOV0pWzAtOV17MTF9fCg/OjIxMzF8MTgwMHwzNVxcZHszfSlcXGR7MTF9KSQvLFxuICAgIGN2diA6IC9eKFswLTldKXszLDR9JC8sXG5cbiAgICAvLyBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9zdGF0ZXMtb2YtdGhlLXR5cGUtYXR0cmlidXRlLmh0bWwjdmFsaWQtZS1tYWlsLWFkZHJlc3NcbiAgICBlbWFpbCA6IC9eW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKyQvLFxuXG4gICAgdXJsIDogL14oaHR0cHM/fGZ0cHxmaWxlfHNzaCk6XFwvXFwvKCgoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDopKkApPygoKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKSl8KCgoW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpBLVpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkqKFthLXpBLVpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKVxcLikrKChbYS16QS1aXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16QS1aXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkqKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuPykoOlxcZCopPykoXFwvKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKSsoXFwvKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKikqKT8pPyhcXD8oKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApfFtcXHVFMDAwLVxcdUY4RkZdfFxcL3xcXD8pKik/KFxcIygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8XFwvfFxcPykqKT8kLyxcbiAgICAvLyBhYmMuZGVcbiAgICBkb21haW4gOiAvXihbYS16QS1aMC05XShbYS16QS1aMC05XFwtXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsOH0kLyxcblxuICAgIGRhdGV0aW1lIDogL14oWzAtMl1bMC05XXszfSlcXC0oWzAtMV1bMC05XSlcXC0oWzAtM11bMC05XSlUKFswLTVdWzAtOV0pXFw6KFswLTVdWzAtOV0pXFw6KFswLTVdWzAtOV0pKFp8KFtcXC1cXCtdKFswLTFdWzAtOV0pXFw6MDApKSQvLFxuICAgIC8vIFlZWVktTU0tRERcbiAgICBkYXRlIDogLyg/OjE5fDIwKVswLTldezJ9LSg/Oig/OjBbMS05XXwxWzAtMl0pLSg/OjBbMS05XXwxWzAtOV18MlswLTldKXwoPzooPyEwMikoPzowWzEtOV18MVswLTJdKS0oPzozMCkpfCg/Oig/OjBbMTM1NzhdfDFbMDJdKS0zMSkpJC8sXG4gICAgLy8gSEg6TU06U1NcbiAgICB0aW1lIDogL14oMFswLTldfDFbMC05XXwyWzAtM10pKDpbMC01XVswLTldKXsyfSQvLFxuICAgIGRhdGVJU08gOiAvXlxcZHs0fVtcXC9cXC1dXFxkezEsMn1bXFwvXFwtXVxcZHsxLDJ9JC8sXG4gICAgLy8gTU0vREQvWVlZWVxuICAgIG1vbnRoX2RheV95ZWFyIDogL14oMFsxLTldfDFbMDEyXSlbLSBcXC8uXSgwWzEtOV18WzEyXVswLTldfDNbMDFdKVstIFxcLy5dXFxkezR9JC8sXG4gICAgLy8gREQvTU0vWVlZWVxuICAgIGRheV9tb250aF95ZWFyIDogL14oMFsxLTldfFsxMl1bMC05XXwzWzAxXSlbLSBcXC8uXSgwWzEtOV18MVswMTJdKVstIFxcLy5dXFxkezR9JC8sXG5cbiAgICAvLyAjRkZGIG9yICNGRkZGRkZcbiAgICBjb2xvciA6IC9eIz8oW2EtZkEtRjAtOV17Nn18W2EtZkEtRjAtOV17M30pJC9cbiAgfSxcblxuICAvKipcbiAgICogT3B0aW9uYWwgdmFsaWRhdGlvbiBmdW5jdGlvbnMgdG8gYmUgdXNlZC4gYGVxdWFsVG9gIGJlaW5nIHRoZSBvbmx5IGRlZmF1bHQgaW5jbHVkZWQgZnVuY3Rpb24uXG4gICAqIEZ1bmN0aW9ucyBzaG91bGQgcmV0dXJuIG9ubHkgYSBib29sZWFuIGlmIHRoZSBpbnB1dCBpcyB2YWxpZCBvciBub3QuIEZ1bmN0aW9ucyBhcmUgZ2l2ZW4gdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAqIGVsIDogVGhlIGpRdWVyeSBlbGVtZW50IHRvIHZhbGlkYXRlLlxuICAgKiByZXF1aXJlZCA6IEJvb2xlYW4gdmFsdWUgb2YgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBiZSBwcmVzZW50IG9yIG5vdC5cbiAgICogcGFyZW50IDogVGhlIGRpcmVjdCBwYXJlbnQgb2YgdGhlIGlucHV0LlxuICAgKiBAb3B0aW9uXG4gICAqL1xuICB2YWxpZGF0b3JzOiB7XG4gICAgZXF1YWxUbzogZnVuY3Rpb24gKGVsLCByZXF1aXJlZCwgcGFyZW50KSB7XG4gICAgICByZXR1cm4gJChgIyR7ZWwuYXR0cignZGF0YS1lcXVhbHRvJyl9YCkudmFsKCkgPT09IGVsLnZhbCgpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWJpZGUsICdBYmlkZScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIERyb3Bkb3duIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcm9wZG93bi5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93bi5cbiAgICogICAgICAgIE9iamVjdCBzaG91bGQgYmUgb2YgdGhlIGRyb3Bkb3duIHBhbmVsLCByYXRoZXIgdGhhbiBpdHMgYW5jaG9yLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bicsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkubGVuZ3RoID8gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkgOiAkKGBbZGF0YS1vcGVuPVwiJHskaWR9XCJdYCk7XG4gICAgdGhpcy4kYW5jaG9yLmF0dHIoe1xuICAgICAgJ2FyaWEtY29udHJvbHMnOiAkaWQsXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXG4gICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlXG5cbiAgICB9KTtcblxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XG4gICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ2FyaWEtaGlkZGVuJzogJ3RydWUnLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXG4gICAgICAnZGF0YS1yZXNpemUnOiAkaWQsXG4gICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogdGhpcy4kYW5jaG9yWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2RkLWFuY2hvcicpXG4gICAgfSk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGRldGVybWluZSBjdXJyZW50IG9yaWVudGF0aW9uIG9mIGRyb3Bkb3duIHBhbmUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBwb3NpdGlvbiAtIHN0cmluZyB2YWx1ZSBvZiBhIHBvc2l0aW9uIGNsYXNzLlxuICAgKi9cbiAgZ2V0UG9zaXRpb25DbGFzcygpIHtcbiAgICB2YXIgdmVydGljYWxQb3NpdGlvbiA9IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8odG9wfGxlZnR8cmlnaHR8Ym90dG9tKS9nKTtcbiAgICAgICAgdmVydGljYWxQb3NpdGlvbiA9IHZlcnRpY2FsUG9zaXRpb24gPyB2ZXJ0aWNhbFBvc2l0aW9uWzBdIDogJyc7XG4gICAgdmFyIGhvcml6b250YWxQb3NpdGlvbiA9IC9mbG9hdC0oXFxTKykvLmV4ZWModGhpcy4kYW5jaG9yWzBdLmNsYXNzTmFtZSk7XG4gICAgICAgIGhvcml6b250YWxQb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvblsxXSA6ICcnO1xuICAgIHZhciBwb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvbiArICcgJyArIHZlcnRpY2FsUG9zaXRpb24gOiB2ZXJ0aWNhbFBvc2l0aW9uO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkanVzdHMgdGhlIGRyb3Bkb3duIHBhbmVzIG9yaWVudGF0aW9uIGJ5IGFkZGluZy9yZW1vdmluZyBwb3NpdGlvbmluZyBjbGFzc2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb24gY2xhc3MgdG8gcmVtb3ZlLlxuICAgKi9cbiAgX3JlcG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMucHVzaChwb3NpdGlvbiA/IHBvc2l0aW9uIDogJ2JvdHRvbScpO1xuICAgIC8vZGVmYXVsdCwgdHJ5IHN3aXRjaGluZyB0byBvcHBvc2l0ZSBzaWRlXG4gICAgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd0b3AnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1cblxuICAgIC8vaWYgZGVmYXVsdCBjaGFuZ2UgZGlkbid0IHdvcmssIHRyeSBib3R0b20gb3IgbGVmdCBmaXJzdFxuICAgIGVsc2UgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfVxuICAgIC8vaWYgbm90aGluZyBjbGVhcmVkLCBzZXQgdG8gYm90dG9tXG4gICAgZWxzZXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy5jb3VudGVyLS07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSBkcm9wZG93biBwYW5lLCBjaGVja3MgZm9yIGNvbGxpc2lvbnMuXG4gICAqIFJlY3Vyc2l2ZWx5IGNhbGxzIGl0c2VsZiBpZiBhIGNvbGxpc2lvbiBpcyBkZXRlY3RlZCwgd2l0aCBhIG5ldyBwb3NpdGlvbiBjbGFzcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0UG9zaXRpb24oKSB7XG4gICAgaWYodGhpcy4kYW5jaG9yLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ2ZhbHNlJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpLFxuICAgICAgICAkZWxlRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kZWxlbWVudCksXG4gICAgICAgICRhbmNob3JEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRhbmNob3IpLFxuICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgIGRpcmVjdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2xlZnQnID8gJ2xlZnQnIDogKChwb3NpdGlvbiA9PT0gJ3JpZ2h0JykgPyAnbGVmdCcgOiAndG9wJykpLFxuICAgICAgICBwYXJhbSA9IChkaXJlY3Rpb24gPT09ICd0b3AnKSA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgb2Zmc2V0ID0gKHBhcmFtID09PSAnaGVpZ2h0JykgPyB0aGlzLm9wdGlvbnMudk9mZnNldCA6IHRoaXMub3B0aW9ucy5oT2Zmc2V0O1xuXG5cblxuICAgIGlmKCgkZWxlRGltcy53aWR0aCA+PSAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50KSkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgICAgJ3dpZHRoJzogJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xuXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCwgZmFsc2UsIHRydWUpICYmIHRoaXMuY291bnRlcil7XG4gICAgICB0aGlzLl9yZXBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBlbGVtZW50IHV0aWxpemluZyB0aGUgdHJpZ2dlcnMgdXRpbGl0eSBsaWJyYXJ5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5fc2V0UG9zaXRpb24uYmluZCh0aGlzKVxuICAgIH0pO1xuXG4gICAgaWYodGhpcy5vcHRpb25zLmhvdmVyKXtcbiAgICAgIHRoaXMuJGFuY2hvci5vZmYoJ21vdXNlZW50ZXIuemYuZHJvcGRvd24gbW91c2VsZWF2ZS56Zi5kcm9wZG93bicpXG4gICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoJCgnYm9keVtkYXRhLXdoYXRpbnB1dD1cIm1vdXNlXCJdJykuaXMoJyonKSkge1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCB0cnVlKTtcbiAgICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgICB9KTtcbiAgICAgIGlmKHRoaXMub3B0aW9ucy5ob3ZlclBhbmUpe1xuICAgICAgICB0aGlzLiRlbGVtZW50Lm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIGZhbHNlKTtcbiAgICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiRhbmNob3IuYWRkKHRoaXMuJGVsZW1lbnQpLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oZSkge1xuXG4gICAgICB2YXIgJHRhcmdldCA9ICQodGhpcyksXG4gICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZShfdGhpcy4kZWxlbWVudCk7XG5cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bicsIHtcbiAgICAgICAgdGFiX2ZvcndhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxuICAgICAgICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoMCkuZm9jdXMoKTtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHsgLy8gaWYgZm9jdXMgaXMgbm90IHRyYXBwZWQsIGNsb3NlIGRyb3Bkb3duIG9uIGZvY3VzIG91dFxuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApKSB8fCBfdGhpcy4kZWxlbWVudC5pcygnOmZvY3VzJykpIHsgLy8gbGVmdCBtb2RhbCB1cHdhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGxhc3QgZWxlbWVudFxuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7IC8vIGlmIGZvY3VzIHNoYWxsIGJlIHRyYXBwZWRcbiAgICAgICAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKS5mb2N1cygpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5pcyhfdGhpcy4kYW5jaG9yKSkge1xuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSkubm90KHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAkYm9keS5vZmYoJ2NsaWNrLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAub24oJ2NsaWNrLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBpZihfdGhpcy4kYW5jaG9yLmlzKGUudGFyZ2V0KSB8fCBfdGhpcy4kYW5jaG9yLmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKTtcbiAgICAgICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgZHJvcGRvd24gcGFuZSwgYW5kIGZpcmVzIGEgYnViYmxpbmcgZXZlbnQgdG8gY2xvc2Ugb3RoZXIgZHJvcGRvd25zLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyb3Bkb3duI2Nsb3NlbWVcbiAgICogQGZpcmVzIERyb3Bkb3duI3Nob3dcbiAgICovXG4gIG9wZW4oKSB7XG4gICAgLy8gdmFyIF90aGlzID0gdGhpcztcbiAgICAvKipcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBvdGhlciBvcGVuIGRyb3Bkb3duc1xuICAgICAqIEBldmVudCBEcm9wZG93biNjbG9zZW1lXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLmRyb3Bkb3duJywgdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpKTtcbiAgICB0aGlzLiRhbmNob3IuYWRkQ2xhc3MoJ2hvdmVyJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIC8vIHRoaXMuJGVsZW1lbnQvKi5zaG93KCkqLztcbiAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMpe1xuICAgICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XG4gICAgICBpZigkZm9jdXNhYmxlLmxlbmd0aCl7XG4gICAgICAgICRmb2N1c2FibGUuZXEoMCkuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgb25jZSB0aGUgZHJvcGRvd24gaXMgdmlzaWJsZS5cbiAgICAgKiBAZXZlbnQgRHJvcGRvd24jc2hvd1xuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBvcGVuIGRyb3Bkb3duIHBhbmUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJvcGRvd24jaGlkZVxuICAgKi9cbiAgY2xvc2UoKSB7XG4gICAgaWYoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKVxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogdHJ1ZX0pO1xuXG4gICAgdGhpcy4kYW5jaG9yLnJlbW92ZUNsYXNzKCdob3ZlcicpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuXG4gICAgaWYodGhpcy5jbGFzc0NoYW5nZWQpe1xuICAgICAgdmFyIGN1clBvc2l0aW9uQ2xhc3MgPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKTtcbiAgICAgIGlmKGN1clBvc2l0aW9uQ2xhc3Mpe1xuICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGN1clBvc2l0aW9uQ2xhc3MpO1xuICAgICAgfVxuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcylcbiAgICAgICAgICAvKi5oaWRlKCkqLy5jc3Moe2hlaWdodDogJycsIHdpZHRoOiAnJ30pO1xuICAgICAgdGhpcy5jbGFzc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuY291bnRlciA9IDQ7XG4gICAgICB0aGlzLnVzZWRQb3NpdGlvbnMubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBkcm9wZG93biBwYW5lJ3MgdmlzaWJpbGl0eS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgaWYodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcbiAgICAgIGlmKHRoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicpKSByZXR1cm47XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGRyb3Bkb3duLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyJykuaGlkZSgpO1xuICAgIHRoaXMuJGFuY2hvci5vZmYoJy56Zi5kcm9wZG93bicpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkRyb3Bkb3duLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMjUwXG4gICAqL1xuICBob3ZlckRlbGF5OiAyNTAsXG4gIC8qKlxuICAgKiBBbGxvdyBzdWJtZW51cyB0byBvcGVuIG9uIGhvdmVyIGV2ZW50c1xuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBob3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBEb24ndCBjbG9zZSBkcm9wZG93biB3aGVuIGhvdmVyaW5nIG92ZXIgZHJvcGRvd24gcGFuZVxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGhvdmVyUGFuZTogZmFsc2UsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICB2T2Zmc2V0OiAxLFxuICAvKipcbiAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgaE9mZnNldDogMSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gYWRqdXN0IG9wZW4gcG9zaXRpb24uIEpTIHdpbGwgdGVzdCBhbmQgZmlsbCB0aGlzIGluLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0b3AnXG4gICAqL1xuICBwb3NpdGlvbkNsYXNzOiAnJyxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gdHJhcCBmb2N1cyB0byB0aGUgZHJvcGRvd24gcGFuZSBpZiBvcGVuZWQgd2l0aCBrZXlib2FyZCBjb21tYW5kcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgdHJhcEZvY3VzOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gc2V0IGZvY3VzIHRvIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudCB3aXRoaW4gdGhlIHBhbmUsIHJlZ2FyZGxlc3Mgb2YgbWV0aG9kIG9mIG9wZW5pbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b0ZvY3VzOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyBhIGNsaWNrIG9uIHRoZSBib2R5IHRvIGNsb3NlIHRoZSBkcm9wZG93bi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiBmYWxzZVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd24sICdEcm9wZG93bicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93bi1tZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgRHJvcGRvd25NZW51IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRHJvcGRvd25NZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd25NZW51Jyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luLCBhbmQgY2FsbHMgX3ByZXBhcmVNZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHN1YnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3MoJ2ZpcnN0LXN1YicpO1xuXG4gICAgdGhpcy4kbWVudUl0ZW1zID0gdGhpcy4kZWxlbWVudC5maW5kKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzLmZpbmQoJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMudmVydGljYWxDbGFzcyk7XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMucmlnaHRDbGFzcykgfHwgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ3JpZ2h0JyB8fCBGb3VuZGF0aW9uLnJ0bCgpIHx8IHRoaXMuJGVsZW1lbnQucGFyZW50cygnLnRvcC1iYXItcmlnaHQnKS5pcygnKicpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID0gJ3JpZ2h0JztcbiAgICAgIHN1YnMuYWRkQ2xhc3MoJ29wZW5zLWxlZnQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtcmlnaHQnKTtcbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH07XG5cbiAgX2lzVmVydGljYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHRhYnMuY3NzKCdkaXNwbGF5JykgPT09ICdibG9jayc7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gZWxlbWVudHMgd2l0aGluIHRoZSBtZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBoYXNUb3VjaCA9ICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgIT09ICd1bmRlZmluZWQnKSxcbiAgICAgICAgcGFyQ2xhc3MgPSAnaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnO1xuXG4gICAgLy8gdXNlZCBmb3Igb25DbGljayBhbmQgaW4gdGhlIGtleWJvYXJkIGhhbmRsZXJzXG4gICAgdmFyIGhhbmRsZUNsaWNrRm4gPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGVsZW0gPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgYC4ke3BhckNsYXNzfWApLFxuICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcbiAgICAgICAgICBoYXNDbGlja2VkID0gJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScsXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpO1xuXG4gICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgIGlmIChoYXNDbGlja2VkKSB7XG4gICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayB8fCAoIV90aGlzLm9wdGlvbnMuY2xpY2tPcGVuICYmICFoYXNUb3VjaCkgfHwgKF90aGlzLm9wdGlvbnMuZm9yY2VGb2xsb3cgJiYgaGFzVG91Y2gpKSB7IHJldHVybjsgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW0uYWRkKCRlbGVtLnBhcmVudHNVbnRpbChfdGhpcy4kZWxlbWVudCwgYC4ke3BhckNsYXNzfWApKS5hdHRyKCdkYXRhLWlzLWNsaWNrJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmKF90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrSW5zaWRlKXtcbiAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrT3BlbiB8fCBoYXNUb3VjaCkge1xuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdjbGljay56Zi5kcm9wZG93bm1lbnUgdG91Y2hzdGFydC56Zi5kcm9wZG93bm1lbnUnLCBoYW5kbGVDbGlja0ZuKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG5cbiAgICAgICAgaWYgKGhhc1N1Yikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcbiAgICAgICAgaWYgKGhhc1N1YiAmJiBfdGhpcy5vcHRpb25zLmF1dG9jbG9zZSkge1xuICAgICAgICAgIGlmICgkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyAmJiBfdGhpcy5vcHRpb25zLmNsaWNrT3BlbikgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxuICAgICAgICAgIGlzVGFiID0gX3RoaXMuJHRhYnMuaW5kZXgoJGVsZW1lbnQpID4gLTEsXG4gICAgICAgICAgJGVsZW1lbnRzID0gaXNUYWIgPyBfdGhpcy4kdGFicyA6ICRlbGVtZW50LnNpYmxpbmdzKCdsaScpLmFkZCgkZWxlbWVudCksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaS0xKTtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbmV4dFNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9LCBwcmV2U2libGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcHJldkVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3ViID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcbiAgICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7IHJldHVybjsgfVxuICAgICAgfSwgY2xvc2VTdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9pZiAoJGVsZW1lbnQuaXMoJzpmaXJzdC1jaGlsZCcpKSB7XG4gICAgICAgIHZhciBjbG9zZSA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJyk7XG4gICAgICAgIGNsb3NlLmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgX3RoaXMuX2hpZGUoY2xvc2UpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vfVxuICAgICAgfTtcbiAgICAgIHZhciBmdW5jdGlvbnMgPSB7XG4gICAgICAgIG9wZW46IG9wZW5TdWIsXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5faGlkZShfdGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgX3RoaXMuJG1lbnVJdGVtcy5maW5kKCdhOmZpcnN0JykuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKGlzVGFiKSB7XG4gICAgICAgIGlmIChfdGhpcy5faXNWZXJ0aWNhbCgpKSB7IC8vIHZlcnRpY2FsIG1lbnVcbiAgICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyBsZWZ0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogY2xvc2VTdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgLy8gaG9yaXpvbnRhbCBtZW51XG4gICAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIG5leHQ6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBwcmV2aW91czogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIGRvd246IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgbmV4dDogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgICAgdXA6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIG5vdCB0YWJzIC0+IG9uZSBzdWJcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICBwcmV2aW91czogb3BlblN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bk1lbnUnLCBmdW5jdGlvbnMpO1xuXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KSxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JylcbiAgICAgICAgIC5vbignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICB2YXIgJGxpbmsgPSBfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KTtcbiAgICAgICAgICAgaWYgKCRsaW5rLmxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICBfdGhpcy5faGlkZSgpO1xuICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpO1xuICAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgYSBkcm9wZG93biBwYW5lLCBhbmQgY2hlY2tzIGZvciBjb2xsaXNpb25zIGZpcnN0LlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHN1YiAtIHVsIGVsZW1lbnQgdGhhdCBpcyBhIHN1Ym1lbnUgdG8gc2hvd1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNzaG93XG4gICAqL1xuICBfc2hvdygkc3ViKSB7XG4gICAgdmFyIGlkeCA9IHRoaXMuJHRhYnMuaW5kZXgodGhpcy4kdGFicy5maWx0ZXIoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgIHJldHVybiAkKGVsKS5maW5kKCRzdWIpLmxlbmd0aCA+IDA7XG4gICAgfSkpO1xuICAgIHZhciAkc2licyA9ICRzdWIucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLnNpYmxpbmdzKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgIHRoaXMuX2hpZGUoJHNpYnMsIGlkeCk7XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuYWRkQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoeydhcmlhLWhpZGRlbic6IGZhbHNlfSlcbiAgICAgICAgLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIHZhciBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgaWYgKCFjbGVhcikge1xuICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJy1yaWdodCcgOiAnLWxlZnQnLFxuICAgICAgICAgICRwYXJlbnRMaSA9ICRzdWIucGFyZW50KCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMke29sZENsYXNzfWApLmFkZENsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCk7XG4gICAgICBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgICBpZiAoIWNsZWFyKSB7XG4gICAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApLmFkZENsYXNzKCdvcGVucy1pbm5lcicpO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG5ldyBkcm9wZG93biBwYW5lIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3dubWVudScsIFskc3ViXSk7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBoaWRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGlkZSgkZWxlbSwgaWR4KSB7XG4gICAgdmFyICR0b0Nsb3NlO1xuICAgIGlmICgkZWxlbSAmJiAkZWxlbS5sZW5ndGgpIHtcbiAgICAgICR0b0Nsb3NlID0gJGVsZW07XG4gICAgfSBlbHNlIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiR0YWJzLm5vdChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiRlbGVtZW50O1xuICAgIH1cbiAgICB2YXIgc29tZXRoaW5nVG9DbG9zZSA9ICR0b0Nsb3NlLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSB8fCAkdG9DbG9zZS5maW5kKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMDtcblxuICAgIGlmIChzb21ldGhpbmdUb0Nsb3NlKSB7XG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAnZGF0YS1pcy1jbGljayc6IGZhbHNlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAgICR0b0Nsb3NlLmZpbmQoJ3VsLmpzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnanMtZHJvcGRvd24tYWN0aXZlJyk7XG5cbiAgICAgIGlmICh0aGlzLmNoYW5nZWQgfHwgJHRvQ2xvc2UuZmluZCgnb3BlbnMtaW5uZXInKS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGQoJHRvQ2xvc2UpXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGBvcGVucy1pbm5lciBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YClcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYG9wZW5zLSR7b2xkQ2xhc3N9YCk7XG4gICAgICAgIHRoaXMuY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBvcGVuIG1lbnVzIGFyZSBjbG9zZWQuXG4gICAgICAgKiBAZXZlbnQgRHJvcGRvd25NZW51I2hpZGVcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3dubWVudScsIFskdG9DbG9zZV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9mZignLnpmLmRyb3Bkb3dubWVudScpLnJlbW92ZUF0dHIoJ2RhdGEtaXMtY2xpY2snKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXJpZ2h0LWFycm93IGlzLWxlZnQtYXJyb3cgaXMtZG93bi1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0IG9wZW5zLWlubmVyJyk7XG4gICAgJChkb2N1bWVudC5ib2R5KS5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuRHJvcGRvd25NZW51LmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogRGlzYWxsb3dzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgc3VibWVudXNcbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGlzYWJsZUhvdmVyOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBhdXRvbWF0aWNhbGx5IGNsb3NlIG9uIGEgbW91c2VsZWF2ZSBldmVudCwgaWYgbm90IGNsaWNrZWQgb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvY2xvc2U6IHRydWUsXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MFxuICAgKi9cbiAgaG92ZXJEZWxheTogNTAsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gb3Blbi9yZW1haW4gb3BlbiBvbiBwYXJlbnQgY2xpY2sgZXZlbnQuIEFsbG93cyBjdXJzb3IgdG8gbW92ZSBhd2F5IGZyb20gbWVudS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbGlja09wZW46IGZhbHNlLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgY2xvc2luZyBhIHN1Ym1lbnUgb24gYSBtb3VzZWxlYXZlIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cblxuICBjbG9zaW5nVGltZTogNTAwLFxuICAvKipcbiAgICogUG9zaXRpb24gb2YgdGhlIG1lbnUgcmVsYXRpdmUgdG8gd2hhdCBkaXJlY3Rpb24gdGhlIHN1Ym1lbnVzIHNob3VsZCBvcGVuLiBIYW5kbGVkIGJ5IEpTLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdsZWZ0J1xuICAgKi9cbiAgYWxpZ25tZW50OiAnbGVmdCcsXG4gIC8qKlxuICAgKiBBbGxvdyBjbGlja3Mgb24gdGhlIGJvZHkgdG8gY2xvc2UgYW55IG9wZW4gc3VibWVudXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAvKipcbiAgICogQWxsb3cgY2xpY2tzIG9uIGxlYWYgYW5jaG9yIGxpbmtzIHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGlja0luc2lkZTogdHJ1ZSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdmVydGljYWwgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgdmVydGljYWxgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndmVydGljYWwnXG4gICAqL1xuICB2ZXJ0aWNhbENsYXNzOiAndmVydGljYWwnLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byByaWdodC1zaWRlIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYGFsaWduLXJpZ2h0YC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2FsaWduLXJpZ2h0J1xuICAgKi9cbiAgcmlnaHRDbGFzczogJ2FsaWduLXJpZ2h0JyxcbiAgLyoqXG4gICAqIEJvb2xlYW4gdG8gZm9yY2Ugb3ZlcmlkZSB0aGUgY2xpY2tpbmcgb2YgbGlua3MgdG8gcGVyZm9ybSBkZWZhdWx0IGFjdGlvbiwgb24gc2Vjb25kIHRvdWNoIGV2ZW50IGZvciBtb2JpbGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGZvcmNlRm9sbG93OiB0cnVlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd25NZW51LCAnRHJvcGRvd25NZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBJbnRlcmNoYW5nZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uaW50ZXJjaGFuZ2VcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyXG4gKi9cblxuY2xhc3MgSW50ZXJjaGFuZ2Uge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBJbnRlcmNoYW5nZS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgSW50ZXJjaGFuZ2UuZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMucnVsZXMgPSBbXTtcbiAgICB0aGlzLmN1cnJlbnRQYXRoID0gJyc7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdJbnRlcmNoYW5nZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBJbnRlcmNoYW5nZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgaW50ZXJjaGFuZ2UgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLl9hZGRCcmVha3BvaW50cygpO1xuICAgIHRoaXMuX2dlbmVyYXRlUnVsZXMoKTtcbiAgICB0aGlzLl9yZWZsb3coKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEludGVyY2hhbmdlLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYuaW50ZXJjaGFuZ2UnLCBGb3VuZGF0aW9uLnV0aWwudGhyb3R0bGUodGhpcy5fcmVmbG93LmJpbmQodGhpcyksIDUwKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgSW50ZXJjaGFuZ2UgdXBvbiBET00gY2hhbmdlXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICB2YXIgbWF0Y2g7XG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlLCBidXQgb25seSBzYXZlIHRoZSBsYXN0IG1hdGNoXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnJ1bGVzKSB7XG4gICAgICBpZih0aGlzLnJ1bGVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBydWxlID0gdGhpcy5ydWxlc1tpXTtcblxuICAgICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocnVsZS5xdWVyeSkubWF0Y2hlcykge1xuICAgICAgICAgIG1hdGNoID0gcnVsZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgdGhpcy5yZXBsYWNlKG1hdGNoLnBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBGb3VuZGF0aW9uIGJyZWFrcG9pbnRzIGFuZCBhZGRzIHRoZW0gdG8gdGhlIEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFUyBvYmplY3QuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJyZWFrcG9pbnRzKCkge1xuICAgIGZvciAodmFyIGkgaW4gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LnF1ZXJpZXMpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllc1tpXTtcbiAgICAgICAgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5Lm5hbWVdID0gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgSW50ZXJjaGFuZ2UgZWxlbWVudCBmb3IgdGhlIHByb3ZpZGVkIG1lZGlhIHF1ZXJ5ICsgY29udGVudCBwYWlyaW5nc1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRoYXQgaXMgYW4gSW50ZXJjaGFuZ2UgaW5zdGFuY2VcbiAgICogQHJldHVybnMge0FycmF5fSBzY2VuYXJpb3MgLSBBcnJheSBvZiBvYmplY3RzIHRoYXQgaGF2ZSAnbXEnIGFuZCAncGF0aCcga2V5cyB3aXRoIGNvcnJlc3BvbmRpbmcga2V5c1xuICAgKi9cbiAgX2dlbmVyYXRlUnVsZXMoZWxlbWVudCkge1xuICAgIHZhciBydWxlc0xpc3QgPSBbXTtcbiAgICB2YXIgcnVsZXM7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1bGVzKSB7XG4gICAgICBydWxlcyA9IHRoaXMub3B0aW9ucy5ydWxlcztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgnaW50ZXJjaGFuZ2UnKS5tYXRjaCgvXFxbLio/XFxdL2cpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gcnVsZXMpIHtcbiAgICAgIGlmKHJ1bGVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBydWxlID0gcnVsZXNbaV0uc2xpY2UoMSwgLTEpLnNwbGl0KCcsICcpO1xuICAgICAgICB2YXIgcGF0aCA9IHJ1bGUuc2xpY2UoMCwgLTEpLmpvaW4oJycpO1xuICAgICAgICB2YXIgcXVlcnkgPSBydWxlW3J1bGUubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgaWYgKEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV0pIHtcbiAgICAgICAgICBxdWVyeSA9IEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV07XG4gICAgICAgIH1cblxuICAgICAgICBydWxlc0xpc3QucHVzaCh7XG4gICAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzTGlzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGBzcmNgIHByb3BlcnR5IG9mIGFuIGltYWdlLCBvciBjaGFuZ2UgdGhlIEhUTUwgb2YgYSBjb250YWluZXIsIHRvIHRoZSBzcGVjaWZpZWQgcGF0aC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gUGF0aCB0byB0aGUgaW1hZ2Ugb3IgSFRNTCBwYXJ0aWFsLlxuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcbiAgICovXG4gIHJlcGxhY2UocGF0aCkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRQYXRoID09PSBwYXRoKSByZXR1cm47XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICB0cmlnZ2VyID0gJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJztcblxuICAgIC8vIFJlcGxhY2luZyBpbWFnZXNcbiAgICBpZiAodGhpcy4kZWxlbWVudFswXS5ub2RlTmFtZSA9PT0gJ0lNRycpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignc3JjJywgcGF0aCkub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xuICAgICAgfSlcbiAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xuICAgIH1cbiAgICAvLyBSZXBsYWNpbmcgYmFja2dyb3VuZCBpbWFnZXNcbiAgICBlbHNlIGlmIChwYXRoLm1hdGNoKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZ3xzdmd8dGlmZikoWz8jXS4qKT8vaSkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHsgJ2JhY2tncm91bmQtaW1hZ2UnOiAndXJsKCcrcGF0aCsnKScgfSlcbiAgICAgICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcbiAgICB9XG4gICAgLy8gUmVwbGFjaW5nIEhUTUxcbiAgICBlbHNlIHtcbiAgICAgICQuZ2V0KHBhdGgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIF90aGlzLiRlbGVtZW50Lmh0bWwocmVzcG9uc2UpXG4gICAgICAgICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XG4gICAgICAgICQocmVzcG9uc2UpLmZvdW5kYXRpb24oKTtcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiBjb250ZW50IGluIGFuIEludGVyY2hhbmdlIGVsZW1lbnQgaXMgZG9uZSBiZWluZyBsb2FkZWQuXG4gICAgICogQGV2ZW50IEludGVyY2hhbmdlI3JlcGxhY2VkXG4gICAgICovXG4gICAgLy8gdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdyZXBsYWNlZC56Zi5pbnRlcmNoYW5nZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGludGVyY2hhbmdlLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgLy9UT0RPIHRoaXMuXG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuSW50ZXJjaGFuZ2UuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBSdWxlcyB0byBiZSBhcHBsaWVkIHRvIEludGVyY2hhbmdlIGVsZW1lbnRzLiBTZXQgd2l0aCB0aGUgYGRhdGEtaW50ZXJjaGFuZ2VgIGFycmF5IG5vdGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqL1xuICBydWxlczogbnVsbFxufTtcblxuSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTID0ge1xuICAnbGFuZHNjYXBlJzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgJ3BvcnRyYWl0JzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICAncmV0aW5hJzogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksIG9ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihJbnRlcmNoYW5nZSwgJ0ludGVyY2hhbmdlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlTWVudSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyaWxsZG93blxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcm9wZG93bi1tZW51XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZU1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHJlc3BvbnNpdmUgbWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlTWVudScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBNZW51IGJ5IHBhcnNpbmcgdGhlIGNsYXNzZXMgZnJvbSB0aGUgJ2RhdGEtUmVzcG9uc2l2ZU1lbnUnIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICAvLyBUaGUgZmlyc3QgdGltZSBhbiBJbnRlcmNoYW5nZSBwbHVnaW4gaXMgaW5pdGlhbGl6ZWQsIHRoaXMucnVsZXMgaXMgY29udmVydGVkIGZyb20gYSBzdHJpbmcgb2YgXCJjbGFzc2VzXCIgdG8gYW4gb2JqZWN0IG9mIHJ1bGVzXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJ1bGVzID09PSAnc3RyaW5nJykge1xuICAgICAgbGV0IHJ1bGVzVHJlZSA9IHt9O1xuXG4gICAgICAvLyBQYXJzZSBydWxlcyBmcm9tIFwiY2xhc3Nlc1wiIHB1bGxlZCBmcm9tIGRhdGEgYXR0cmlidXRlXG4gICAgICBsZXQgcnVsZXMgPSB0aGlzLnJ1bGVzLnNwbGl0KCcgJyk7XG5cbiAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBydWxlIGZvdW5kXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBydWxlID0gcnVsZXNbaV0uc3BsaXQoJy0nKTtcbiAgICAgICAgbGV0IHJ1bGVTaXplID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVswXSA6ICdzbWFsbCc7XG4gICAgICAgIGxldCBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XG5cbiAgICAgICAgaWYgKE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dICE9PSBudWxsKSB7XG4gICAgICAgICAgcnVsZXNUcmVlW3J1bGVTaXplXSA9IE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMucnVsZXMgPSBydWxlc1RyZWU7XG4gICAgfVxuXG4gICAgaWYgKCEkLmlzRW1wdHlPYmplY3QodGhpcy5ydWxlcykpIHtcbiAgICAgIHRoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgdGhlIE1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH0pO1xuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgc2NyZWVuIHdpZHRoIGFnYWluc3QgYXZhaWxhYmxlIG1lZGlhIHF1ZXJpZXMuIElmIHRoZSBtZWRpYSBxdWVyeSBoYXMgY2hhbmdlZCwgYW5kIHRoZSBwbHVnaW4gbmVlZGVkIGhhcyBjaGFuZ2VkLCB0aGUgcGx1Z2lucyB3aWxsIHN3YXAgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja01lZGlhUXVlcmllcygpIHtcbiAgICB2YXIgbWF0Y2hlZE1xLCBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSBhbmQgZmluZCB0aGUgbGFzdCBtYXRjaGluZyBydWxlXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KGtleSkpIHtcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcbiAgICBpZiAoIW1hdGNoZWRNcSkgcmV0dXJuO1xuXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luIGluc3RhbmNlb2YgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbikgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xuICAgICQuZWFjaChNZW51UGx1Z2lucywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBuZXcgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbih0aGlzLiRlbGVtZW50LCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgJCh3aW5kb3cpLm9mZignLnpmLlJlc3BvbnNpdmVNZW51Jyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XG5cbi8vIFRoZSBwbHVnaW4gbWF0Y2hlcyB0aGUgcGx1Z2luIGNsYXNzZXMgd2l0aCB0aGVzZSBwbHVnaW4gaW5zdGFuY2VzLlxudmFyIE1lbnVQbHVnaW5zID0ge1xuICBkcm9wZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJvcGRvd24tbWVudSddIHx8IG51bGxcbiAgfSxcbiBkcmlsbGRvd246IHtcbiAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcmlsbGRvd24nXSB8fCBudWxsXG4gIH0sXG4gIGFjY29yZGlvbjoge1xuICAgIGNzc0NsYXNzOiAnYWNjb3JkaW9uLW1lbnUnLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snYWNjb3JkaW9uLW1lbnUnXSB8fCBudWxsXG4gIH1cbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlTWVudSwgJ1Jlc3BvbnNpdmVNZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlVG9nZ2xlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVGFiIEJhci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCB0YWIgYmFyIGZ1bmN0aW9uYWxpdHkgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XG4gICAgaWYgKCF0YXJnZXRJRCkge1xuICAgICAgY29uc29sZS5lcnJvcignWW91ciB0YWIgYmFyIG5lZWRzIGFuIElEIG9mIGEgTWVudSBhcyB0aGUgdmFsdWUgb2YgZGF0YS10YWItYmFyLicpO1xuICAgIH1cblxuICAgIHRoaXMuJHRhcmdldE1lbnUgPSAkKGAjJHt0YXJnZXRJRH1gKTtcbiAgICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJyk7XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHRhYiBiYXIgdG8gd29yay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLl91cGRhdGVNcUhhbmRsZXIgPSB0aGlzLl91cGRhdGUuYmluZCh0aGlzKTtcbiAgICBcbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZU1xSGFuZGxlcik7XG5cbiAgICB0aGlzLiR0b2dnbGVyLm9uKCdjbGljay56Zi5yZXNwb25zaXZlVG9nZ2xlJywgdGhpcy50b2dnbGVNZW51LmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBtZWRpYSBxdWVyeSB0byBkZXRlcm1pbmUgaWYgdGhlIHRhYiBiYXIgc2hvdWxkIGJlIHZpc2libGUgb3IgaGlkZGVuLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGUoKSB7XG4gICAgLy8gTW9iaWxlXG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdygpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5oaWRlKCk7XG4gICAgfVxuXG4gICAgLy8gRGVza3RvcFxuICAgIGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5oaWRlKCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnNob3coKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhci4gVGhlIHRvZ2dsZSBvbmx5IGhhcHBlbnMgaWYgdGhlIHNjcmVlbiBpcyBzbWFsbCBlbm91Z2ggdG8gYWxsb3cgaXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAqL1xuICB0b2dnbGVNZW51KCkgeyAgIFxuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnRvZ2dsZSgwKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgfVxuICB9O1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgdGhpcy4kdG9nZ2xlci5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgXG4gICAgJCh3aW5kb3cpLm9mZignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fdXBkYXRlTXFIYW5kbGVyKTtcbiAgICBcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRoZSBicmVha3BvaW50IGFmdGVyIHdoaWNoIHRoZSBtZW51IGlzIGFsd2F5cyBzaG93biwgYW5kIHRoZSB0YWIgYmFyIGlzIGhpZGRlbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xuICAgKi9cbiAgaGlkZUZvcjogJ21lZGl1bSdcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlVG9nZ2xlLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogUmV2ZWFsIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXZlYWxcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uIGlmIHVzaW5nIGFuaW1hdGlvbnNcbiAqL1xuXG5jbGFzcyBSZXZlYWwge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBSZXZlYWwuXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGZvciB0aGUgbW9kYWwuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb3B0aW9uYWwgcGFyYW1ldGVycy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmV2ZWFsLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmV2ZWFsJyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignUmV2ZWFsJywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZScsXG4gICAgICAnVEFCJzogJ3RhYl9mb3J3YXJkJyxcbiAgICAgICdTSElGVF9UQUInOiAndGFiX2JhY2t3YXJkJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBtb2RhbCBieSBhZGRpbmcgdGhlIG92ZXJsYXkgYW5kIGNsb3NlIGJ1dHRvbnMsIChpZiBzZWxlY3RlZCkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLmlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLmNhY2hlZCA9IHttcTogRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmN1cnJlbnR9O1xuICAgIHRoaXMuaXNNb2JpbGUgPSBtb2JpbGVTbmlmZigpO1xuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKS5sZW5ndGggPyAkKGBbZGF0YS1vcGVuPVwiJHt0aGlzLmlkfVwiXWApIDogJChgW2RhdGEtdG9nZ2xlPVwiJHt0aGlzLmlkfVwiXWApO1xuICAgIHRoaXMuJGFuY2hvci5hdHRyKHtcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogdGhpcy5pZCxcbiAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICd0YWJpbmRleCc6IDBcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbiB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmdWxsJykpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuID0gdHJ1ZTtcbiAgICAgIHRoaXMub3B0aW9ucy5vdmVybGF5ID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSAmJiAhdGhpcy4kb3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheSA9IHRoaXMuX21ha2VPdmVybGF5KHRoaXMuaWQpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XG4gICAgICAgICdyb2xlJzogJ2RpYWxvZycsXG4gICAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAgICdkYXRhLXlldGktYm94JzogdGhpcy5pZCxcbiAgICAgICAgJ2RhdGEtcmVzaXplJzogdGhpcy5pZFxuICAgIH0pO1xuXG4gICAgaWYodGhpcy4kb3ZlcmxheSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5kZXRhY2goKS5hcHBlbmRUbyh0aGlzLiRvdmVybGF5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5kZXRhY2goKS5hcHBlbmRUbygkKCdib2R5JykpO1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnd2l0aG91dC1vdmVybGF5Jyk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cygpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVlcExpbmsgJiYgd2luZG93LmxvY2F0aW9uLmhhc2ggPT09ICggYCMke3RoaXMuaWR9YCkpIHtcbiAgICAgICQod2luZG93KS5vbmUoJ2xvYWQuemYucmV2ZWFsJywgdGhpcy5vcGVuLmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIG92ZXJsYXkgZGl2IHRvIGRpc3BsYXkgYmVoaW5kIHRoZSBtb2RhbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9tYWtlT3ZlcmxheShpZCkge1xuICAgIHZhciAkb3ZlcmxheSA9ICQoJzxkaXY+PC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdyZXZlYWwtb3ZlcmxheScpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbygnYm9keScpO1xuICAgIHJldHVybiAkb3ZlcmxheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHBvc2l0aW9uIG9mIG1vZGFsXG4gICAqIFRPRE86ICBGaWd1cmUgb3V0IGlmIHdlIGFjdHVhbGx5IG5lZWQgdG8gY2FjaGUgdGhlc2UgdmFsdWVzIG9yIGlmIGl0IGRvZXNuJ3QgbWF0dGVyXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfdXBkYXRlUG9zaXRpb24oKSB7XG4gICAgdmFyIHdpZHRoID0gdGhpcy4kZWxlbWVudC5vdXRlcldpZHRoKCk7XG4gICAgdmFyIG91dGVyV2lkdGggPSAkKHdpbmRvdykud2lkdGgoKTtcbiAgICB2YXIgaGVpZ2h0ID0gdGhpcy4kZWxlbWVudC5vdXRlckhlaWdodCgpO1xuICAgIHZhciBvdXRlckhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcbiAgICB2YXIgbGVmdCwgdG9wO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaE9mZnNldCA9PT0gJ2F1dG8nKSB7XG4gICAgICBsZWZ0ID0gcGFyc2VJbnQoKG91dGVyV2lkdGggLSB3aWR0aCkgLyAyLCAxMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxlZnQgPSBwYXJzZUludCh0aGlzLm9wdGlvbnMuaE9mZnNldCwgMTApO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLnZPZmZzZXQgPT09ICdhdXRvJykge1xuICAgICAgaWYgKGhlaWdodCA+IG91dGVySGVpZ2h0KSB7XG4gICAgICAgIHRvcCA9IHBhcnNlSW50KE1hdGgubWluKDEwMCwgb3V0ZXJIZWlnaHQgLyAxMCksIDEwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvcCA9IHBhcnNlSW50KChvdXRlckhlaWdodCAtIGhlaWdodCkgLyA0LCAxMCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvcCA9IHBhcnNlSW50KHRoaXMub3B0aW9ucy52T2Zmc2V0LCAxMCk7XG4gICAgfVxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHt0b3A6IHRvcCArICdweCd9KTtcbiAgICAvLyBvbmx5IHdvcnJ5IGFib3V0IGxlZnQgaWYgd2UgZG9uJ3QgaGF2ZSBhbiBvdmVybGF5IG9yIHdlIGhhdmVhICBob3Jpem9udGFsIG9mZnNldCxcbiAgICAvLyBvdGhlcndpc2Ugd2UncmUgcGVyZmVjdGx5IGluIHRoZSBtaWRkbGVcbiAgICBpZighdGhpcy4kb3ZlcmxheSB8fCAodGhpcy5vcHRpb25zLmhPZmZzZXQgIT09ICdhdXRvJykpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtsZWZ0OiBsZWZ0ICsgJ3B4J30pO1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3Moe21hcmdpbjogJzBweCd9KTtcbiAgICB9XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgbW9kYWwuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogKGV2ZW50LCAkZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoKGV2ZW50LnRhcmdldCA9PT0gX3RoaXMuJGVsZW1lbnRbMF0pIHx8XG4gICAgICAgICAgICAoJChldmVudC50YXJnZXQpLnBhcmVudHMoJ1tkYXRhLWNsb3NhYmxlXScpWzBdID09PSAkZWxlbWVudCkpIHsgLy8gb25seSBjbG9zZSByZXZlYWwgd2hlbiBpdCdzIGV4cGxpY2l0bHkgY2FsbGVkXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY2xvc2UuYXBwbHkodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy4kYW5jaG9yLmxlbmd0aCkge1xuICAgICAgdGhpcy4kYW5jaG9yLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUud2hpY2ggPT09IDEzIHx8IGUud2hpY2ggPT09IDMyKSB7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5yZXZlYWwnKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8IFxuICAgICAgICAgICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSB8fCBcbiAgICAgICAgICAgICEkLmNvbnRhaW5zKGRvY3VtZW50LCBlLnRhcmdldCkpIHsgXG4gICAgICAgICAgICAgIHJldHVybjsgXG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAkKHdpbmRvdykub24oYHBvcHN0YXRlLnpmLnJldmVhbDoke3RoaXMuaWR9YCwgdGhpcy5faGFuZGxlU3RhdGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW9kYWwgbWV0aG9kcyBvbiBiYWNrL2ZvcndhcmQgYnV0dG9uIGNsaWNrcyBvciBhbnkgb3RoZXIgZXZlbnQgdGhhdCB0cmlnZ2VycyBwb3BzdGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVTdGF0ZShlKSB7XG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhhc2ggPT09ICggJyMnICsgdGhpcy5pZCkgJiYgIXRoaXMuaXNBY3RpdmUpeyB0aGlzLm9wZW4oKTsgfVxuICAgIGVsc2V7IHRoaXMuY2xvc2UoKTsgfVxuICB9XG5cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG1vZGFsIGNvbnRyb2xsZWQgYnkgYHRoaXMuJGFuY2hvcmAsIGFuZCBjbG9zZXMgYWxsIG90aGVycyBieSBkZWZhdWx0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZW1lXG4gICAqIEBmaXJlcyBSZXZlYWwjb3BlblxuICAgKi9cbiAgb3BlbigpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICB2YXIgaGFzaCA9IGAjJHt0aGlzLmlkfWA7XG5cbiAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgLy8gTWFrZSBlbGVtZW50cyBpbnZpc2libGUsIGJ1dCByZW1vdmUgZGlzcGxheTogbm9uZSBzbyB3ZSBjYW4gZ2V0IHNpemUgYW5kIHBvc2l0aW9uaW5nXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuY3NzKHsgJ3Zpc2liaWxpdHknOiAnaGlkZGVuJyB9KVxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJ30pLnNob3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmhpZGUoKVxuICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJycgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pLmhpZGUoKTtcbiAgICAgIGlmKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2Zhc3QnKSkge1xuICAgICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdmYXN0Jyk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nsb3cnKSkge1xuICAgICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdzbG93Jyk7XG4gICAgICB9XG4gICAgfVxuXG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5tdWx0aXBsZU9wZW5lZCkge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIG1vZGFsIG9wZW5zLlxuICAgICAgICogQ2xvc2VzIGFueSBvdGhlciBtb2RhbHMgdGhhdCBhcmUgY3VycmVudGx5IG9wZW5cbiAgICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VtZVxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYucmV2ZWFsJywgdGhpcy5pZCk7XG4gICAgfVxuICAgIC8vIE1vdGlvbiBVSSBtZXRob2Qgb2YgcmV2ZWFsXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb25Jbikge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGZ1bmN0aW9uIGFmdGVyQW5pbWF0aW9uRm9jdXMoKXtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnRcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgICAgICd0YWJpbmRleCc6IC0xXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kb3ZlcmxheSwgJ2ZhZGUtaW4nKTtcbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sICgpID0+IHtcbiAgICAgICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcbiAgICAgICAgYWZ0ZXJBbmltYXRpb25Gb2N1cygpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgcmV2ZWFsXG4gICAgZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5zaG93KDApO1xuICAgICAgfVxuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KHRoaXMub3B0aW9ucy5zaG93RGVsYXkpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBhY2Nlc3NpYmlsaXR5XG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgJ3RhYmluZGV4JzogLTFcbiAgICAgIH0pXG4gICAgICAuZm9jdXMoKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG1vZGFsIGhhcyBzdWNjZXNzZnVsbHkgb3BlbmVkLlxuICAgICAqIEBldmVudCBSZXZlYWwjb3BlblxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb3Blbi56Zi5yZXZlYWwnKTtcblxuICAgIGlmICh0aGlzLmlzTW9iaWxlKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsU2Nyb2xsUG9zID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgJCgnaHRtbCwgYm9keScpLmFkZENsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX2V4dHJhSGFuZGxlcnMoKTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV4dHJhIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgYm9keSBhbmQgd2luZG93IGlmIG5lY2Vzc2FyeS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9leHRyYUhhbmRsZXJzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiAhdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4pIHtcbiAgICAgICQoJ2JvZHknKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8IFxuICAgICAgICAgICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSB8fCBcbiAgICAgICAgICAgICEkLmNvbnRhaW5zKGRvY3VtZW50LCBlLnRhcmdldCkpIHsgcmV0dXJuOyB9XG4gICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICQod2luZG93KS5vbigna2V5ZG93bi56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XG4gICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGxvY2sgZm9jdXMgd2l0aGluIG1vZGFsIHdoaWxlIHRhYmJpbmdcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZShfdGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKSkpIHsgLy8gbGVmdCBtb2RhbCBkb3dud2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICAgICAgX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoMCkuZm9jdXMoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoID09PSAwKSB7IC8vIG5vIGZvY3VzYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIG1vZGFsIGF0IGFsbCwgcHJldmVudCB0YWJiaW5nIGluIGdlbmVyYWxcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZShfdGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmVxKDApKSB8fCBfdGhpcy4kZWxlbWVudC5pcygnOmZvY3VzJykpIHsgLy8gbGVmdCBtb2RhbCB1cHdhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGxhc3QgZWxlbWVudFxuICAgICAgICAgICAgX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmxlbmd0aCA9PT0gMCkgeyAvLyBubyBmb2N1c2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBtb2RhbCBhdCBhbGwsIHByZXZlbnQgdGFiYmluZyBpbiBnZW5lcmFsXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKSkpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIHNldCBmb2N1cyBiYWNrIHRvIGFuY2hvciBpZiBjbG9zZSBidXR0b24gaGFzIGJlZW4gYWN0aXZhdGVkXG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJHRhcmdldC5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cykpIHsgLy8gZG9udCd0IHRyaWdnZXIgaWYgYWN1YWwgZWxlbWVudCBoYXMgZm9jdXMgKGkuZS4gaW5wdXRzLCBsaW5rcywgLi4uKVxuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbihwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBtb2RhbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBSZXZlYWwjY2xvc2VkXG4gICAqL1xuICBjbG9zZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNBY3RpdmUgfHwgIXRoaXMuJGVsZW1lbnQuaXMoJzp2aXNpYmxlJykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIE1vdGlvbiBVSSBtZXRob2Qgb2YgaGlkaW5nXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb25PdXQpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJG92ZXJsYXksICdmYWRlLW91dCcsIGZpbmlzaFVwKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBmaW5pc2hVcCgpO1xuICAgICAgfVxuXG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJGVsZW1lbnQsIHRoaXMub3B0aW9ucy5hbmltYXRpb25PdXQpO1xuICAgIH1cbiAgICAvLyBqUXVlcnkgbWV0aG9kIG9mIGhpZGluZ1xuICAgIGVsc2Uge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgwLCBmaW5pc2hVcCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZmluaXNoVXAoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy4kZWxlbWVudC5oaWRlKHRoaXMub3B0aW9ucy5oaWRlRGVsYXkpO1xuICAgIH1cblxuICAgIC8vIENvbmRpdGlvbmFscyB0byByZW1vdmUgZXh0cmEgZXZlbnQgbGlzdGVuZXJzIGFkZGVkIG9uIG9wZW5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICQod2luZG93KS5vZmYoJ2tleWRvd24uemYucmV2ZWFsJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMub3ZlcmxheSAmJiB0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XG4gICAgICAkKCdib2R5Jykub2ZmKCdjbGljay56Zi5yZXZlYWwnKTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9mZigna2V5ZG93bi56Zi5yZXZlYWwnKTtcblxuICAgIGZ1bmN0aW9uIGZpbmlzaFVwKCkge1xuICAgICAgaWYgKF90aGlzLmlzTW9iaWxlKSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5yZW1vdmVDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICAgICAgaWYoX3RoaXMub3JpZ2luYWxTY3JvbGxQb3MpIHtcbiAgICAgICAgICAkKCdib2R5Jykuc2Nyb2xsVG9wKF90aGlzLm9yaWdpbmFsU2Nyb2xsUG9zKTtcbiAgICAgICAgICBfdGhpcy5vcmlnaW5hbFNjcm9sbFBvcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgICB9XG5cbiAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG5cbiAgICAgIC8qKlxuICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBpcyBkb25lIGNsb3NpbmcuXG4gICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VkXG4gICAgICAqL1xuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUmVzZXRzIHRoZSBtb2RhbCBjb250ZW50XG4gICAgKiBUaGlzIHByZXZlbnRzIGEgcnVubmluZyB2aWRlbyB0byBrZWVwIGdvaW5nIGluIHRoZSBiYWNrZ3JvdW5kXG4gICAgKi9cbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc2V0T25DbG9zZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5odG1sKHRoaXMuJGVsZW1lbnQuaHRtbCgpKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgIGlmIChfdGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSkge1xuICAgICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKFwiXCIsIGRvY3VtZW50LnRpdGxlLCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xuICAgICAgIH1cbiAgICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2VkIHN0YXRlIG9mIGEgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYSBtb2RhbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5hcHBlbmRUbygkKCdib2R5JykpOyAvLyBtb3ZlICRlbGVtZW50IG91dHNpZGUgb2YgJG92ZXJsYXkgdG8gcHJldmVudCBlcnJvciB1bnJlZ2lzdGVyUGx1Z2luKClcbiAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgpLm9mZigpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKS5vZmYoKTtcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYnKTtcbiAgICAkKHdpbmRvdykub2ZmKGAuemYucmV2ZWFsOiR7dGhpcy5pZH1gKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfTtcbn1cblxuUmV2ZWFsLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tbGVmdCdcbiAgICovXG4gIGFuaW1hdGlvbkluOiAnJyxcbiAgLyoqXG4gICAqIE1vdGlvbi1VSSBjbGFzcyB0byB1c2UgZm9yIGFuaW1hdGVkIGVsZW1lbnRzLiBJZiBub25lIHVzZWQsIGRlZmF1bHRzIHRvIHNpbXBsZSBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3NsaWRlLW91dC1yaWdodCdcbiAgICovXG4gIGFuaW1hdGlvbk91dDogJycsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIG9wZW5pbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBzaG93RGVsYXk6IDAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIGNsb3Npbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBoaWRlRGVsYXk6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGNsb3NlIGlmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGBFU0NBUEVgIGtleS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uRXNjOiB0cnVlLFxuICAvKipcbiAgICogSWYgdHJ1ZSwgYWxsb3dzIG11bHRpcGxlIG1vZGFscyB0byBiZSBkaXNwbGF5ZWQgYXQgb25jZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbXVsdGlwbGVPcGVuZWQ6IGZhbHNlLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgYXV0b1xuICAgKi9cbiAgdk9mZnNldDogJ2F1dG8nLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGluIGZyb20gdGhlIHNpZGUgb2YgdGhlIHNjcmVlbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBhdXRvXG4gICAqL1xuICBoT2Zmc2V0OiAnYXV0bycsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGJlIGZ1bGxzY3JlZW4sIGNvbXBsZXRlbHkgYmxvY2tpbmcgb3V0IHRoZSByZXN0IG9mIHRoZSB2aWV3LiBKUyBjaGVja3MgZm9yIHRoaXMgYXMgd2VsbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZnVsbFNjcmVlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxMFxuICAgKi9cbiAgYnRtT2Zmc2V0UGN0OiAxMCxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBvdmVybGF5OiB0cnVlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byByZW1vdmUgYW5kIHJlaW5qZWN0IG1hcmt1cCBvbiBjbG9zZS4gU2hvdWxkIGJlIHRydWUgaWYgdXNpbmcgdmlkZW8gZWxlbWVudHMgdy9vIHVzaW5nIHByb3ZpZGVyJ3MgYXBpLCBvdGhlcndpc2UsIHZpZGVvcyB3aWxsIGNvbnRpbnVlIHRvIHBsYXkgaW4gdGhlIGJhY2tncm91bmQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHJlc2V0T25DbG9zZTogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGFsdGVyIHRoZSB1cmwgb24gb3Blbi9jbG9zZSwgYW5kIGFsbG93cyB0aGUgdXNlIG9mIHRoZSBgYmFja2AgYnV0dG9uIHRvIGNsb3NlIG1vZGFscy4gQUxTTywgYWxsb3dzIGEgbW9kYWwgdG8gYXV0by1tYW5pYWNhbGx5IG9wZW4gb24gcGFnZSBsb2FkIElGIHRoZSBoYXNoID09PSB0aGUgbW9kYWwncyB1c2VyLXNldCBpZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGVlcExpbms6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XG5cbmZ1bmN0aW9uIGlQaG9uZVNuaWZmKCkge1xuICByZXR1cm4gL2lQKGFkfGhvbmV8b2QpLipPUy8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG5cbmZ1bmN0aW9uIGFuZHJvaWRTbmlmZigpIHtcbiAgcmV0dXJuIC9BbmRyb2lkLy50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KTtcbn1cblxuZnVuY3Rpb24gbW9iaWxlU25pZmYoKSB7XG4gIHJldHVybiBpUGhvbmVTbmlmZigpIHx8IGFuZHJvaWRTbmlmZigpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogVGFicyBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udGFic1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyIGlmIHRhYnMgY29udGFpbiBpbWFnZXNcbiAqL1xuXG5jbGFzcyBUYWJzIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGFicy5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBUYWJzI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byB0YWJzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRhYnMuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUYWJzJyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignVGFicycsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICdwcmV2aW91cycsXG4gICAgICAnQVJST1dfRE9XTic6ICduZXh0JyxcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJ1xuICAgICAgLy8gJ1RBQic6ICduZXh0JyxcbiAgICAgIC8vICdTSElGVF9UQUInOiAncHJldmlvdXMnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYnMgYnkgc2hvd2luZyBhbmQgZm9jdXNpbmcgKGlmIGF1dG9Gb2N1cz10cnVlKSB0aGUgcHJlc2V0IGFjdGl2ZSB0YWIuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kdGFiVGl0bGVzID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWApO1xuICAgIHRoaXMuJHRhYkNvbnRlbnQgPSAkKGBbZGF0YS10YWJzLWNvbnRlbnQ9XCIke3RoaXMuJGVsZW1lbnRbMF0uaWR9XCJdYCk7XG5cbiAgICB0aGlzLiR0YWJUaXRsZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkbGluayA9ICRlbGVtLmZpbmQoJ2EnKSxcbiAgICAgICAgICBpc0FjdGl2ZSA9ICRlbGVtLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSxcbiAgICAgICAgICBoYXNoID0gJGxpbmtbMF0uaGFzaC5zbGljZSgxKSxcbiAgICAgICAgICBsaW5rSWQgPSAkbGlua1swXS5pZCA/ICRsaW5rWzBdLmlkIDogYCR7aGFzaH0tbGFiZWxgLFxuICAgICAgICAgICR0YWJDb250ZW50ID0gJChgIyR7aGFzaH1gKTtcblxuICAgICAgJGVsZW0uYXR0cih7J3JvbGUnOiAncHJlc2VudGF0aW9uJ30pO1xuXG4gICAgICAkbGluay5hdHRyKHtcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBoYXNoLFxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGlzQWN0aXZlLFxuICAgICAgICAnaWQnOiBsaW5rSWRcbiAgICAgIH0pO1xuXG4gICAgICAkdGFiQ29udGVudC5hdHRyKHtcbiAgICAgICAgJ3JvbGUnOiAndGFicGFuZWwnLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOiAhaXNBY3RpdmUsXG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWRcbiAgICAgIH0pO1xuXG4gICAgICBpZihpc0FjdGl2ZSAmJiBfdGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XG4gICAgICAgICRsaW5rLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMubWF0Y2hIZWlnaHQpIHtcbiAgICAgIHZhciAkaW1hZ2VzID0gdGhpcy4kdGFiQ29udGVudC5maW5kKCdpbWcnKTtcblxuICAgICAgaWYgKCRpbWFnZXMubGVuZ3RoKSB7XG4gICAgICAgIEZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQoJGltYWdlcywgdGhpcy5fc2V0SGVpZ2h0LmJpbmQodGhpcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2V0SGVpZ2h0KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLl9hZGRLZXlIYW5kbGVyKCk7XG4gICAgdGhpcy5fYWRkQ2xpY2tIYW5kbGVyKCk7XG4gICAgdGhpcy5fc2V0SGVpZ2h0TXFIYW5kbGVyID0gbnVsbDtcbiAgICBcbiAgICBpZiAodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KSB7XG4gICAgICB0aGlzLl9zZXRIZWlnaHRNcUhhbmRsZXIgPSB0aGlzLl9zZXRIZWlnaHQuYmluZCh0aGlzKTtcbiAgICAgIFxuICAgICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl9zZXRIZWlnaHRNcUhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGNsaWNrIGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIHRhYnMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQ2xpY2tIYW5kbGVyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub2ZmKCdjbGljay56Zi50YWJzJylcbiAgICAgIC5vbignY2xpY2suemYudGFicycsIGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWAsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCQodGhpcykpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBrZXlib2FyZCBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEtleUhhbmRsZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgJGZpcnN0VGFiID0gX3RoaXMuJGVsZW1lbnQuZmluZCgnbGk6Zmlyc3Qtb2YtdHlwZScpO1xuICAgIHZhciAkbGFzdFRhYiA9IF90aGlzLiRlbGVtZW50LmZpbmQoJ2xpOmxhc3Qtb2YtdHlwZScpO1xuXG4gICAgdGhpcy4kdGFiVGl0bGVzLm9mZigna2V5ZG93bi56Zi50YWJzJykub24oJ2tleWRvd24uemYudGFicycsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYgKGUud2hpY2ggPT09IDkpIHJldHVybjtcbiAgICAgIFxuXG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpLFxuICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXG4gICAgICAgICRwcmV2RWxlbWVudCxcbiAgICAgICAgJG5leHRFbGVtZW50O1xuXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLndyYXBPbktleXMpIHtcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9IGkgPT09IDAgPyAkZWxlbWVudHMubGFzdCgpIDogJGVsZW1lbnRzLmVxKGktMSk7XG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSBpID09PSAkZWxlbWVudHMubGVuZ3RoIC0xID8gJGVsZW1lbnRzLmZpcnN0KCkgOiAkZWxlbWVudHMuZXEoaSsxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpO1xuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWluKGkrMSwgJGVsZW1lbnRzLmxlbmd0aC0xKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdUYWJzJywge1xuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkZWxlbWVudC5maW5kKCdbcm9sZT1cInRhYlwiXScpLmZvY3VzKCk7XG4gICAgICAgICAgX3RoaXMuX2hhbmRsZVRhYkNoYW5nZSgkZWxlbWVudCk7XG4gICAgICAgIH0sXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKS5mb2N1cygpO1xuICAgICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJHByZXZFbGVtZW50KTtcbiAgICAgICAgfSxcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJG5leHRFbGVtZW50LmZpbmQoJ1tyb2xlPVwidGFiXCJdJykuZm9jdXMoKTtcbiAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCRuZXh0RWxlbWVudCk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgdGFiIGAkdGFyZ2V0Q29udGVudGAgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gVGFiIHRvIG9wZW4uXG4gICAqIEBmaXJlcyBUYWJzI2NoYW5nZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9oYW5kbGVUYWJDaGFuZ2UoJHRhcmdldCkge1xuICAgIHZhciAkdGFiTGluayA9ICR0YXJnZXQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKSxcbiAgICAgICAgaGFzaCA9ICR0YWJMaW5rWzBdLmhhc2gsXG4gICAgICAgICR0YXJnZXRDb250ZW50ID0gdGhpcy4kdGFiQ29udGVudC5maW5kKGhhc2gpLFxuICAgICAgICAkb2xkVGFiID0gdGhpcy4kZWxlbWVudC5cbiAgICAgICAgICBmaW5kKGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfS5pcy1hY3RpdmVgKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJylcbiAgICAgICAgICAuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKVxuICAgICAgICAgIC5hdHRyKHsgJ2FyaWEtc2VsZWN0ZWQnOiAnZmFsc2UnIH0pO1xuXG4gICAgJChgIyR7JG9sZFRhYi5hdHRyKCdhcmlhLWNvbnRyb2xzJyl9YClcbiAgICAgIC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJylcbiAgICAgIC5hdHRyKHsgJ2FyaWEtaGlkZGVuJzogJ3RydWUnIH0pO1xuXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAkdGFiTGluay5hdHRyKHsnYXJpYS1zZWxlY3RlZCc6ICd0cnVlJ30pO1xuXG4gICAgJHRhcmdldENvbnRlbnRcbiAgICAgIC5hZGRDbGFzcygnaXMtYWN0aXZlJylcbiAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiAnZmFsc2UnfSk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIHN1Y2Nlc3NmdWxseSBjaGFuZ2VkIHRhYnMuXG4gICAgICogQGV2ZW50IFRhYnMjY2hhbmdlXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjaGFuZ2UuemYudGFicycsIFskdGFyZ2V0XSk7XG4gIH1cblxuICAvKipcbiAgICogUHVibGljIG1ldGhvZCBmb3Igc2VsZWN0aW5nIGEgY29udGVudCBwYW5lIHRvIGRpc3BsYXkuXG4gICAqIEBwYXJhbSB7alF1ZXJ5IHwgU3RyaW5nfSBlbGVtIC0galF1ZXJ5IG9iamVjdCBvciBzdHJpbmcgb2YgdGhlIGlkIG9mIHRoZSBwYW5lIHRvIGRpc3BsYXkuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgc2VsZWN0VGFiKGVsZW0pIHtcbiAgICB2YXIgaWRTdHI7XG5cbiAgICBpZiAodHlwZW9mIGVsZW0gPT09ICdvYmplY3QnKSB7XG4gICAgICBpZFN0ciA9IGVsZW1bMF0uaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkU3RyID0gZWxlbTtcbiAgICB9XG5cbiAgICBpZiAoaWRTdHIuaW5kZXhPZignIycpIDwgMCkge1xuICAgICAgaWRTdHIgPSBgIyR7aWRTdHJ9YDtcbiAgICB9XG5cbiAgICB2YXIgJHRhcmdldCA9IHRoaXMuJHRhYlRpdGxlcy5maW5kKGBbaHJlZj1cIiR7aWRTdHJ9XCJdYCkucGFyZW50KGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWApO1xuXG4gICAgdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCR0YXJnZXQpO1xuICB9O1xuICAvKipcbiAgICogU2V0cyB0aGUgaGVpZ2h0IG9mIGVhY2ggcGFuZWwgdG8gdGhlIGhlaWdodCBvZiB0aGUgdGFsbGVzdCBwYW5lbC5cbiAgICogSWYgZW5hYmxlZCBpbiBvcHRpb25zLCBnZXRzIGNhbGxlZCBvbiBtZWRpYSBxdWVyeSBjaGFuZ2UuXG4gICAqIElmIGxvYWRpbmcgY29udGVudCB2aWEgZXh0ZXJuYWwgc291cmNlLCBjYW4gYmUgY2FsbGVkIGRpcmVjdGx5IG9yIHdpdGggX3JlZmxvdy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0SGVpZ2h0KCkge1xuICAgIHZhciBtYXggPSAwO1xuICAgIHRoaXMuJHRhYkNvbnRlbnRcbiAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMucGFuZWxDbGFzc31gKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBhbmVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGlzQWN0aXZlID0gcGFuZWwuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgICAgICBwYW5lbC5jc3Moeyd2aXNpYmlsaXR5JzogJ2hpZGRlbicsICdkaXNwbGF5JzogJ2Jsb2NrJ30pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlbXAgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcblxuICAgICAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICAgICAgcGFuZWwuY3NzKHtcbiAgICAgICAgICAgICd2aXNpYmlsaXR5JzogJycsXG4gICAgICAgICAgICAnZGlzcGxheSc6ICcnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBtYXggPSB0ZW1wID4gbWF4ID8gdGVtcCA6IG1heDtcbiAgICAgIH0pXG4gICAgICAuY3NzKCdoZWlnaHQnLCBgJHttYXh9cHhgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhbiB0YWJzLlxuICAgKiBAZmlyZXMgVGFicyNkZXN0cm95ZWRcbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9YClcbiAgICAgIC5vZmYoJy56Zi50YWJzJykuaGlkZSgpLmVuZCgpXG4gICAgICAuZmluZChgLiR7dGhpcy5vcHRpb25zLnBhbmVsQ2xhc3N9YClcbiAgICAgIC5oaWRlKCk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KSB7XG4gICAgICBpZiAodGhpcy5fc2V0SGVpZ2h0TXFIYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgICQod2luZG93KS5vZmYoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3NldEhlaWdodE1xSGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblRhYnMuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIHdpbmRvdyB0byBzY3JvbGwgdG8gY29udGVudCBvZiBhY3RpdmUgcGFuZSBvbiBsb2FkIGlmIHNldCB0byB0cnVlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhdXRvRm9jdXM6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBBbGxvd3Mga2V5Ym9hcmQgaW5wdXQgdG8gJ3dyYXAnIGFyb3VuZCB0aGUgdGFiIGxpbmtzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIHdyYXBPbktleXM6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgdGFiIGNvbnRlbnQgcGFuZXMgdG8gbWF0Y2ggaGVpZ2h0cyBpZiBzZXQgdG8gdHJ1ZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbWF0Y2hIZWlnaHQ6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIGBsaWAncyBpbiB0YWIgbGluayBsaXN0LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0YWJzLXRpdGxlJ1xuICAgKi9cbiAgbGlua0NsYXNzOiAndGFicy10aXRsZScsXG5cbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRlbnQgY29udGFpbmVycy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndGFicy1wYW5lbCdcbiAgICovXG4gIHBhbmVsQ2xhc3M6ICd0YWJzLXBhbmVsJ1xufTtcblxuZnVuY3Rpb24gY2hlY2tDbGFzcygkZWxlbSl7XG4gIHJldHVybiAkZWxlbS5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihUYWJzLCAnVGFicycpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogVG9nZ2xlciBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9nZ2xlclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqL1xuXG5jbGFzcyBUb2dnbGVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVG9nZ2xlci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBUb2dnbGVyI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBUb2dnbGVyLmRlZmF1bHRzLCBlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5jbGFzc05hbWUgPSAnJztcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1RvZ2dsZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgVG9nZ2xlciBwbHVnaW4gYnkgcGFyc2luZyB0aGUgdG9nZ2xlIGNsYXNzIGZyb20gZGF0YS10b2dnbGVyLCBvciBhbmltYXRpb24gY2xhc3NlcyBmcm9tIGRhdGEtYW5pbWF0ZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgaW5wdXQ7XG4gICAgLy8gUGFyc2UgYW5pbWF0aW9uIGNsYXNzZXMgaWYgdGhleSB3ZXJlIHNldFxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0ZSkge1xuICAgICAgaW5wdXQgPSB0aGlzLm9wdGlvbnMuYW5pbWF0ZS5zcGxpdCgnICcpO1xuXG4gICAgICB0aGlzLmFuaW1hdGlvbkluID0gaW5wdXRbMF07XG4gICAgICB0aGlzLmFuaW1hdGlvbk91dCA9IGlucHV0WzFdIHx8IG51bGw7XG4gICAgfVxuICAgIC8vIE90aGVyd2lzZSwgcGFyc2UgdG9nZ2xlIGNsYXNzXG4gICAgZWxzZSB7XG4gICAgICBpbnB1dCA9IHRoaXMuJGVsZW1lbnQuZGF0YSgndG9nZ2xlcicpO1xuICAgICAgLy8gQWxsb3cgZm9yIGEgLiBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmdcbiAgICAgIHRoaXMuY2xhc3NOYW1lID0gaW5wdXRbMF0gPT09ICcuJyA/IGlucHV0LnNsaWNlKDEpIDogaW5wdXQ7XG4gICAgfVxuXG4gICAgLy8gQWRkIEFSSUEgYXR0cmlidXRlcyB0byB0cmlnZ2Vyc1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQ7XG4gICAgJChgW2RhdGEtb3Blbj1cIiR7aWR9XCJdLCBbZGF0YS1jbG9zZT1cIiR7aWR9XCJdLCBbZGF0YS10b2dnbGU9XCIke2lkfVwiXWApXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcbiAgICAvLyBJZiB0aGUgdGFyZ2V0IGlzIGhpZGRlbiwgYWRkIGFyaWEtaGlkZGVuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpID8gZmFsc2UgOiB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSB0b2dnbGUgdHJpZ2dlci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b2dnbGUuemYudHJpZ2dlcicpLm9uKCd0b2dnbGUuemYudHJpZ2dlcicsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIHRhcmdldCBjbGFzcyBvbiB0aGUgdGFyZ2V0IGVsZW1lbnQuIEFuIGV2ZW50IGlzIGZpcmVkIGZyb20gdGhlIG9yaWdpbmFsIHRyaWdnZXIgZGVwZW5kaW5nIG9uIGlmIHRoZSByZXN1bHRhbnQgc3RhdGUgd2FzIFwib25cIiBvciBcIm9mZlwiLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFRvZ2dsZXIjb25cbiAgICogQGZpcmVzIFRvZ2dsZXIjb2ZmXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgdGhpc1sgdGhpcy5vcHRpb25zLmFuaW1hdGUgPyAnX3RvZ2dsZUFuaW1hdGUnIDogJ190b2dnbGVDbGFzcyddKCk7XG4gIH1cblxuICBfdG9nZ2xlQ2xhc3MoKSB7XG4gICAgdGhpcy4kZWxlbWVudC50b2dnbGVDbGFzcyh0aGlzLmNsYXNzTmFtZSk7XG5cbiAgICB2YXIgaXNPbiA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xuICAgIGlmIChpc09uKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBoYXMgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb25cbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgZG9lcyBub3QgaGF2ZSB0aGUgY2xhc3MgYWZ0ZXIgYSB0b2dnbGUuXG4gICAgICAgKiBAZXZlbnQgVG9nZ2xlciNvZmZcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUFSSUEoaXNPbik7XG4gIH1cblxuICBfdG9nZ2xlQW5pbWF0ZSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZUluKHRoaXMuJGVsZW1lbnQsIHRoaXMuYW5pbWF0aW9uSW4sIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5fdXBkYXRlQVJJQSh0cnVlKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJGVsZW1lbnQsIHRoaXMuYW5pbWF0aW9uT3V0LCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZUFSSUEoZmFsc2UpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ29mZi56Zi50b2dnbGVyJyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQVJJQShpc09uKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPbiA/IHRydWUgOiBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIFRvZ2dsZXIgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRvZ2dsZXInKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuVG9nZ2xlci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRlbGxzIHRoZSBwbHVnaW4gaWYgdGhlIGVsZW1lbnQgc2hvdWxkIGFuaW1hdGVkIHdoZW4gdG9nZ2xlZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYW5pbWF0ZTogZmFsc2Vcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihUb2dnbGVyLCAnVG9nZ2xlcicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdylcbiAgICBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbn0pKCk7XG5cbnZhciBpbml0Q2xhc3NlcyAgID0gWydtdWktZW50ZXInLCAnbXVpLWxlYXZlJ107XG52YXIgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbi8vIEZpbmQgdGhlIHJpZ2h0IFwidHJhbnNpdGlvbmVuZFwiIGV2ZW50IGZvciB0aGlzIGJyb3dzZXJcbnZhciBlbmRFdmVudCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdPVHJhbnNpdGlvbic6ICdvdHJhbnNpdGlvbmVuZCdcbiAgfVxuICB2YXIgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3RdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHRyYW5zaXRpb25zW3RdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufSkoKTtcblxuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICBpZiAoZW5kRXZlbnQgPT09IG51bGwpIHtcbiAgICBpc0luID8gZWxlbWVudC5zaG93KCkgOiBlbGVtZW50LmhpZGUoKTtcbiAgICBjYigpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpbml0Q2xhc3MgPSBpc0luID8gaW5pdENsYXNzZXNbMF0gOiBpbml0Q2xhc3Nlc1sxXTtcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xuXG4gIC8vIFNldCB1cCB0aGUgYW5pbWF0aW9uXG4gIHJlc2V0KCk7XG4gIGVsZW1lbnQuYWRkQ2xhc3MoYW5pbWF0aW9uKTtcbiAgZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgZWxlbWVudFswXS5vZmZzZXRXaWR0aDtcbiAgICBlbGVtZW50LmNzcygndHJhbnNpdGlvbicsICcnKTtcbiAgICBlbGVtZW50LmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKCd0cmFuc2l0aW9uZW5kJywgZmluaXNoKTtcblxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICBpZiAoIWlzSW4pIGVsZW1lbnQuaGlkZSgpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcbiAgfVxuXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhpbml0Q2xhc3MgKyAnICcgKyBhY3RpdmVDbGFzcyArICcgJyArIGFuaW1hdGlvbik7XG4gIH1cbn1cblxudmFyIE1vdGlvblVJID0ge1xuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKHRydWUsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9LFxuXG4gIGFuaW1hdGVPdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfVxufTtcbiIsIihmdW5jdGlvbiAoJCkge1xuICAgIHZhciBpb24yc0ltYWdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gaW9uMnNJbWFnZShlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgIHRoaXMuX2luaXQoKTtcbiAgICAgICAgICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ2lvbjJzSW1hZ2UnKTtcbiAgICAgICAgfVxuICAgICAgICBpb24yc0ltYWdlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGljayhmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGFsID0gJChcIiNtZWRpYS1tb2RhbFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kYWxfY29udGVudCA9ICQoXCIjbWVkaWEtbW9kYWwtY29udGVudFwiKTtcbiAgICAgICAgICAgICAgICBtb2RhbF9jb250ZW50Lmh0bWwoXCJcIik7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGkub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGVyY2VudGFnZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50Lmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSBldmVudC5sb2FkZWQgLyBldmVudC50b3RhbCAqIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwZXJjZW50YWdlKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaGVpZ2h0KHBlcmNlbnRhZ2UgKyBcIiVcIik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpLnNyYyA9IGV2dC5jdXJyZW50VGFyZ2V0LmhyZWY7XG4gICAgICAgICAgICAgICAgbW9kYWxfY29udGVudC5hcHBlbmQoaSk7XG4gICAgICAgICAgICAgICAgaS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBtb2RhbC5mb3VuZGF0aW9uKCdvcGVuJyk7IH07XG4gICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgICAgICB9O1xuICAgICAgICBpb24yc0ltYWdlLnByb3RvdHlwZS5fZXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB9O1xuICAgICAgICBpb24yc0ltYWdlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnVuYmluZCgnY2xpY2snKTtcbiAgICAgICAgICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGlvbjJzSW1hZ2U7XG4gICAgfSgpKTtcbiAgICBGb3VuZGF0aW9uLnBsdWdpbihpb24yc0ltYWdlLCAnaW9uMnNJbWFnZScpO1xufSkoalF1ZXJ5KTtcbiIsIihmdW5jdGlvbiAoJCkge1xuICAgICQoXCIudG9nZ2xlclwiKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9ICQodGhpcyk7XG4gICAgICAgIGlmIChfdGhpcy5oYXNDbGFzcyhcInRvZ2dsZW1lXCIpKSB7XG4gICAgICAgICAgICBfdGhpcy50b2dnbGVDbGFzcyhcInRvZ2dsZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5zaWJsaW5ncyhcIi50b2dnbGVtZVwiKS50b2dnbGVDbGFzcyhcInRvZ2dsZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV4Y2hhbmdlVGV4dCA9IF90aGlzLmRhdGEoXCJ0b2dnbGVcIik7XG4gICAgICAgIGlmIChleGNoYW5nZVRleHQgPT0gXCJcIikge1xuICAgICAgICAgICAgX3RoaXMuZGF0YShcInRvZ2dsZVwiLCBfdGhpcy5odG1sKCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmRhdGEoXCJ0b2dnbGVcIiwgX3RoaXMuaHRtbCgpKTtcbiAgICAgICAgX3RoaXMuaHRtbChleGNoYW5nZVRleHQpO1xuICAgIH0pO1xufSkoalF1ZXJ5KTtcbiIsImlmICghd2luZG93WydZVCddKSB7XG4gICAgdmFyIFlUID0geyBsb2FkaW5nOiAwLCBsb2FkZWQ6IDAgfTtcbn1cbmlmICghd2luZG93WydZVENvbmZpZyddKSB7XG4gICAgdmFyIFlUQ29uZmlnID0geyAnaG9zdCc6ICdodHRwOi8vd3d3LnlvdXR1YmUuY29tJyB9O1xufVxuaWYgKCFZVC5sb2FkaW5nKSB7XG4gICAgWVQubG9hZGluZyA9IDE7XG4gICAgKGZ1bmN0aW9uICgpIHsgdmFyIGwgPSBbXTsgWVQucmVhZHkgPSBmdW5jdGlvbiAoZikgeyBpZiAoWVQubG9hZGVkKSB7XG4gICAgICAgIGYoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGwucHVzaChmKTtcbiAgICB9IH07IHdpbmRvdy5vbllUUmVhZHkgPSBmdW5jdGlvbiAoKSB7IFlULmxvYWRlZCA9IDE7IGZvciAodmFyIGkgPSAwOyBpIDwgbC5sZW5ndGg7IGkrKykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbFtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICB9IH07IFlULnNldENvbmZpZyA9IGZ1bmN0aW9uIChjKSB7IGZvciAodmFyIGsgaW4gYykge1xuICAgICAgICBpZiAoYy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgWVRDb25maWdba10gPSBjW2tdO1xuICAgICAgICB9XG4gICAgfSB9OyB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpOyBhLnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JzsgYS5pZCA9ICd3d3ctd2lkZ2V0YXBpLXNjcmlwdCc7IGEuc3JjID0gJ2h0dHBzOicgKyAnLy9zLnl0aW1nLmNvbS95dHMvanNiaW4vd3d3LXdpZGdldGFwaS12ZmxMQS1HMk8vd3d3LXdpZGdldGFwaS5qcyc7IGEuYXN5bmMgPSB0cnVlOyB2YXIgYiA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXTsgYi5wYXJlbnROb2RlLmluc2VydEJlZm9yZShhLCBiKTsgfSkoKTtcbn1cbihmdW5jdGlvbiAoJCkge1xuICAgIHZhciBpb24yc1lvdXR1YmUgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBpb24yc1lvdXR1YmUoZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICB0aGlzLl9pbml0KCk7XG4gICAgICAgICAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdpb24yc1lvdXR1YmUnKTtcbiAgICAgICAgfVxuICAgICAgICBpb24yc1lvdXR1YmUucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsaWNrKGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xuICAgICAgICAgICAgICAgIHZhciBtb2RhbCA9ICQoXCIjbWVkaWEtbW9kYWxcIik7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGFsX2NvbnRlbnQgPSAkKFwiI21lZGlhLW1vZGFsLWNvbnRlbnRcIik7XG4gICAgICAgICAgICAgICAgbW9kYWxfY29udGVudC5odG1sKFwiPGRpdiBpZD0ncGxheWVyJz48L2Rpdj5cIik7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllciA9IG5ldyBZVC5QbGF5ZXIoJ3BsYXllcicsIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9JZDogb2JqLmRhdGEoJ2lvbjJzLXlvdXR1YmUnKSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnb25SZWFkeSc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5wbGF5VmlkZW8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5mb3VuZGF0aW9uKCdvcGVuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzKCk7XG4gICAgICAgIH07XG4gICAgICAgIGlvbjJzWW91dHViZS5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgfTtcbiAgICAgICAgaW9uMnNZb3V0dWJlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnVuYmluZCgnY2xpY2snKTtcbiAgICAgICAgICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGlvbjJzWW91dHViZTtcbiAgICB9KCkpO1xuICAgIEZvdW5kYXRpb24ucGx1Z2luKGlvbjJzWW91dHViZSwgJ2lvbjJzWW91dHViZScpO1xuICAgIGZ1bmN0aW9uIG9uWW91VHViZUlmcmFtZUFQSVJlYWR5KCkge1xuICAgIH1cbn0pKGpRdWVyeSk7XG4iLCIoZnVuY3Rpb24gKCQpIHtcbiAgICB2YXIgcGFydGljbGVzID0gW1wiL2ltZy9wb2ludGVyXzAxLnBuZ1wiLFxuICAgICAgICBcIi9pbWcvY2xvdWRfMDEucG5nXCIsXG4gICAgICAgIFwiL2ltZy9zeW1ib2xfMDEucG5nXCIsXG4gICAgXTtcbiAgICBmdW5jdGlvbiBnZXRQYXJ0aWNsZSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRpY2xlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwYXJ0aWNsZXMubGVuZ3RoKV07XG4gICAgfVxuICAgIHZhciBlZmZlY3RGYWRlT2JqZWN0ID0gJChcIi5lZmZlY3QtZmFkZS1zcGF3blwiKTtcbiAgICB2YXIgRmFkZVBhcnRpY2xlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gRmFkZVBhcnRpY2xlKHBhcmVudCwgaW1nKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICB0aGlzLm9iaiA9ICQoXCI8aW1nIGNsYXNzPSdwb2ludGVyJyBzcmM9J1wiICsgaW1nICsgXCInLz5cIik7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kKHRoaXMub2JqKTtcbiAgICAgICAgICAgIHRoaXMub3BhY2l0eSA9IDA7XG4gICAgICAgICAgICB0aGlzLmRlY2F5ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnggPSBNYXRoLnJhbmRvbSgpICogcGFyZW50LndpZHRoKCk7XG4gICAgICAgICAgICB0aGlzLnkgPSBNYXRoLnJhbmRvbSgpICogcGFyZW50LmhlaWdodCgpO1xuICAgICAgICAgICAgdmFyIHNpemUgPSAyMCArIE1hdGgucmFuZG9tKCkgKiAyMDtcbiAgICAgICAgICAgIHRoaXMuc3BlZWQgPSBNYXRoLmZsb29yKDMgKyAzICogTWF0aC5yYW5kb20oKSk7XG4gICAgICAgICAgICB0aGlzLm9iai5jc3MoeyBsZWZ0OiB0aGlzLngsIHRvcDogdGhpcy55IH0pO1xuICAgICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9iai5jc3MoeyBoZWlnaHQ6IHNpemUgKyBcInB4XCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9iai5jc3MoeyB3aWR0aDogc2l6ZSArIFwicHhcIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkZWdyZWUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgICAgICAgICAgdGhpcy5vYmouY3NzKHtcbiAgICAgICAgICAgICAgICAnLXdlYmtpdC10cmFuc2Zvcm0nOiAncm90YXRlKCcgKyBkZWdyZWUgKyAnZGVnKScsXG4gICAgICAgICAgICAgICAgJy1tb3otdHJhbnNmb3JtJzogJ3JvdGF0ZSgnICsgZGVncmVlICsgJ2RlZyknLFxuICAgICAgICAgICAgICAgICctbXMtdHJhbnNmb3JtJzogJ3JvdGF0ZSgnICsgZGVncmVlICsgJ2RlZyknLFxuICAgICAgICAgICAgICAgICctby10cmFuc2Zvcm0nOiAncm90YXRlKCcgKyBkZWdyZWUgKyAnZGVnKScsXG4gICAgICAgICAgICAgICAgJ3RyYW5zZm9ybSc6ICdyb3RhdGUoJyArIGRlZ3JlZSArICdkZWcpJyxcbiAgICAgICAgICAgICAgICAnem9vbSc6IDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLm1vdmUoKTsgfSwgMjAwKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMub2JqLnNob3coKTsgfSwgMjUwKTtcbiAgICAgICAgfVxuICAgICAgICBGYWRlUGFydGljbGUucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWNheSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wYWNpdHkgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iai5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5vcGFjaXR5IC09IHRoaXMuc3BlZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wYWNpdHkgKz0gdGhpcy5zcGVlZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcGFjaXR5ID49IDEwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2F5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9iai5jc3MoeyBvcGFjaXR5OiB0aGlzLm9wYWNpdHkgKiAwLjAxIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmFkZVBhcnRpY2xlO1xuICAgIH0oKSk7XG4gICAgZnVuY3Rpb24gY3JlYXRlRmFkZVBhcnRpY2xlKCkge1xuICAgICAgICBlZmZlY3RGYWRlT2JqZWN0LmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbmV3IEZhZGVQYXJ0aWNsZSgkKHRoaXMpLCBnZXRQYXJ0aWNsZSgpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVBhcnRpY2xlQWdhaW4oKSB7XG4gICAgICAgIGNyZWF0ZUZhZGVQYXJ0aWNsZSgpO1xuICAgICAgICBzZXRUaW1lb3V0KGNyZWF0ZVBhcnRpY2xlQWdhaW4sIDI1MCArIE1hdGgucmFuZG9tKCkgKiA3NTApO1xuICAgIH1cbn0pKGpRdWVyeSk7XG4iLCIoZnVuY3Rpb24gKCQpIHtcbiAgICB2YXIgcGFydGljbGVfZmlsZXMgPSBbXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDAxLnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAwMi5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMDMucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDA0LnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAwNS5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMDYucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDA3LnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAwOC5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMDkucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDEwLnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAxMS5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMTIucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDEzLnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAxNC5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMTUucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDE2LnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAxNy5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMTgucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDE5LnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAyMC5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2ljb25zL3AwMjEucG5nXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy9pY29ucy9wMDIyLnBuZ1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaWNvbnMvcDAyMy5wbmdcIixcbiAgICAgICAgc3R5bGVzaGVldF9kaXJlY3RvcnlfdXJpICsgXCIvaW1nL2tvbnRha3QtcGZlaWxlLWxpbmtzLnN2Z1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcva29udGFrdC1wZmVpbGUtcmVjaHRzLnN2Z1wiLFxuICAgICAgICBzdHlsZXNoZWV0X2RpcmVjdG9yeV91cmkgKyBcIi9pbWcvaGVyby1zdGFnZS1wZmVpbGUuc3ZnXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy93ZW1vZGFfaGVyb19WMjAxNjExMjEuc3ZnXCIsXG4gICAgICAgIHN0eWxlc2hlZXRfZGlyZWN0b3J5X3VyaSArIFwiL2ltZy93ZW1vZGFfaGVyb19WMjAxNzA0MTAuc3ZnXCIsXG4gICAgXTtcbiAgICBmdW5jdGlvbiBnZXRGaWxlKCkge1xuICAgICAgICByZXR1cm4gcGFydGljbGVfZmlsZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGFydGljbGVfZmlsZXMubGVuZ3RoKV07XG4gICAgfVxuICAgIHZhciBoZXJvX2FuY2hvciA9ICQoXCIubmV4dC1jb250YWluZXJcIik7XG4gICAgdmFyIGhlcm9fYmFzZSA9ICQoXCIjSGVyb1wiKTtcbiAgICB2YXIgY29udGFjdF9hbmNob3IgPSAkKFwiLmNvbnRhY3QtY29udGFpbmVyXCIpO1xuICAgIHZhciBjb250YWN0X2Jhc2UgPSAkKFwiI0tvbnRha3RcIik7XG4gICAgdmFyIFBhcnRpY2xlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gUGFydGljbGUocGFyZW50LCBpbWcsIHgsIHksIHNpemUsIGRlZ3JlZSkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGlmICh4ID09PSB2b2lkIDApIHsgeCA9IE1hdGgucmFuZG9tKCkgKiBwYXJlbnQud2lkdGgoKTsgfVxuICAgICAgICAgICAgaWYgKHkgPT09IHZvaWQgMCkgeyB5ID0gTWF0aC5yYW5kb20oKSAqIHBhcmVudC53aWR0aCgpOyB9XG4gICAgICAgICAgICBpZiAoc2l6ZSA9PT0gdm9pZCAwKSB7IHNpemUgPSAyMCArIE1hdGgucmFuZG9tKCkgKiAyMDsgfVxuICAgICAgICAgICAgaWYgKGRlZ3JlZSA9PT0gdm9pZCAwKSB7IGRlZ3JlZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7IH1cbiAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgICAgICAgICAgdGhpcy5kZWdyZWUgPSBkZWdyZWU7XG4gICAgICAgICAgICB0aGlzLm9iaiA9ICQoXCI8aW1nIGNsYXNzPSdwb2ludGVyJyBzcmM9J1wiICsgaW1nICsgXCInLz5cIik7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kKHRoaXMub2JqKTtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUoKTtcbiAgICAgICAgICAgIHRoaXMucm90YXRlKCk7XG4gICAgICAgICAgICB0aGlzLm1vdmUoKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMub2JqLnNob3coKTsgfSwgMTApO1xuICAgICAgICB9XG4gICAgICAgIFBhcnRpY2xlLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiAoZGVncmVlKSB7XG4gICAgICAgICAgICBpZiAoZGVncmVlID09PSB2b2lkIDApIHsgZGVncmVlID0gdGhpcy5kZWdyZWU7IH1cbiAgICAgICAgICAgIHRoaXMub2JqLmNzcyh7XG4gICAgICAgICAgICAgICAgJy13ZWJraXQtdHJhbnNmb3JtJzogJ3JvdGF0ZSgnICsgZGVncmVlICsgJ2RlZyknLFxuICAgICAgICAgICAgICAgICctbW96LXRyYW5zZm9ybSc6ICdyb3RhdGUoJyArIGRlZ3JlZSArICdkZWcpJyxcbiAgICAgICAgICAgICAgICAnLW1zLXRyYW5zZm9ybSc6ICdyb3RhdGUoJyArIGRlZ3JlZSArICdkZWcpJyxcbiAgICAgICAgICAgICAgICAnLW8tdHJhbnNmb3JtJzogJ3JvdGF0ZSgnICsgZGVncmVlICsgJ2RlZyknLFxuICAgICAgICAgICAgICAgICd0cmFuc2Zvcm0nOiAncm90YXRlKCcgKyBkZWdyZWUgKyAnZGVnKScsXG4gICAgICAgICAgICAgICAgJ3pvb20nOiAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgUGFydGljbGUucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgICAgICAgICAgIGlmIChzaXplID09PSB2b2lkIDApIHsgc2l6ZSA9IHRoaXMuc2l6ZTsgfVxuICAgICAgICAgICAgdGhpcy5vYmouY3NzKHsgaGVpZ2h0OiBzaXplIH0pO1xuICAgICAgICB9O1xuICAgICAgICBQYXJ0aWNsZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSB0aGlzLng7IH1cbiAgICAgICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IHRoaXMueTsgfVxuICAgICAgICAgICAgdGhpcy5vYmouY3NzKHsgbGVmdDogdGhpcy54LCB0b3A6IHRoaXMueSB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFBhcnRpY2xlO1xuICAgIH0oKSk7XG4gICAgdmFyIHBhcnRpY2xlcyA9IFtcbiAgICAgICAgbmV3IFBhcnRpY2xlKGNvbnRhY3RfYW5jaG9yLCBwYXJ0aWNsZV9maWxlc1syM10sIFwiLTUzJVwiLCBcIjIwJVwiLCBcIjU1JVwiLCAwKSxcbiAgICAgICAgbmV3IFBhcnRpY2xlKGNvbnRhY3RfYW5jaG9yLCBwYXJ0aWNsZV9maWxlc1syNF0sIFwiODIlXCIsIFwiMTIlXCIsIFwiODAlXCIsIDApLFxuICAgICAgICBuZXcgUGFydGljbGUoaGVyb19hbmNob3IsIHBhcnRpY2xlX2ZpbGVzWzI3XSwgXCI4NiVcIiwgXCItNDMlXCIsIFwiMTMyJVwiLCAwKSxcbiAgICBdO1xuICAgIGNvbnNvbGUubG9nKHBhcnRpY2xlcyk7XG59KShqUXVlcnkpO1xuIiwiZnVuY3Rpb24gdGhyb3R0bGUoZm4sIHRocmVzaG9sZCwgc2NvcGUpIHtcbiAgICB0aHJlc2hvbGQgfHwgKHRocmVzaG9sZCA9IDI1MCk7XG4gICAgdmFyIGxhc3QsIGRlZmVyVGltZXI7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSBzY29wZSB8fCB0aGlzO1xuICAgICAgICB2YXIgbm93ID0gK25ldyBEYXRlLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICBpZiAobGFzdCAmJiBub3cgPCBsYXN0ICsgdGhyZXNob2xkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoZGVmZXJUaW1lcik7XG4gICAgICAgICAgICBkZWZlclRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbGFzdCA9IG5vdztcbiAgICAgICAgICAgICAgICBmbi5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sIHRocmVzaG9sZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsYXN0ID0gbm93O1xuICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxudmFyIGlzTW9iaWxlID0gZmFsc2U7XG4oZnVuY3Rpb24gKCQpIHtcbiAgICB2YXIgTmF2QmFyID0gJChcIiNuYXYtd3JhcHBlclwiKTtcbiAgICB2YXIgRHJvcGRvd24gPSBOYXZCYXIuZmluZChcIi50b3AtYmFyLWxlZnRcIik7XG4gICAgdmFyIFJlc3BvbnNpdmVNZW51QnV0dG9uID0gTmF2QmFyLmZpbmQoXCJbZGF0YS1yZXNwb25zaXZlLXRvZ2dsZT0ncmVzcG9uc2l2ZS1tZW51J11cIik7XG4gICAgdmFyIG9sZHBvc2l0aW9uID0gMDtcbiAgICAkKHdpbmRvdykuc2Nyb2xsKHRocm90dGxlKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgc2Nyb2xsUG9zID0gd2luZG93LnNjcm9sbFk7XG4gICAgICAgIGlmICghc2Nyb2xsUG9zKSB7XG4gICAgICAgICAgICBzY3JvbGxQb3MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkaXIgPSAob2xkcG9zaXRpb24gPj0gc2Nyb2xsUG9zKSA/IDAgOiAxO1xuICAgICAgICBvbGRwb3NpdGlvbiA9IHNjcm9sbFBvcztcbiAgICAgICAgaWYgKCFpc01vYmlsZSkge1xuICAgICAgICAgICAgaWYgKHNjcm9sbFBvcyA8IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIklTTU9CSURFXCIpO1xuICAgICAgICAgICAgICAgIGlzTW9iaWxlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgTmF2SGVpZ2h0ID0gTmF2QmFyLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGlmICgxID09IGRpcikge1xuICAgICAgICAgICAgaWYgKChEcm9wZG93bi5jc3MoJ2Rpc3BsYXknKSAhPSAnYmxvY2snIHx8IFJlc3BvbnNpdmVNZW51QnV0dG9uLmNzcygnZGlzcGxheScpICE9ICdibG9jaycpICYmICFpc01vYmlsZSB8fCAoaXNNb2JpbGUgJiYgc2Nyb2xsUG9zID4gMTApKSB7XG4gICAgICAgICAgICAgICAgTmF2QmFyLmNzcyh7ICd0b3AnOiAoLU5hdkhlaWdodCkgKyBcInB4XCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc01vYmlsZSkge1xuICAgICAgICAgICAgICAgIE5hdkJhci5jc3MoeyAndG9wJzogMCArIFwicHhcIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIE5hdkJhci5jc3MoeyAndG9wJzogMCArIFwicHhcIiB9KTtcbiAgICAgICAgfVxuICAgIH0sIDI1MCkpO1xufSkoalF1ZXJ5KTtcbiIsIihmdW5jdGlvbiAoJCkge1xuICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiAgICAkKGRvY3VtZW50KS5maW5kKCcjcmVzcG9uc2l2ZS1tZW51JykuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQoJy50b2dnbGUtdG9wLWJhcicpLmNsaWNrKCk7XG4gICAgfSk7XG59KShqUXVlcnkpO1xuIiwiKGZ1bmN0aW9uICgkKSB7XG4gICAgZnVuY3Rpb24gc2VuZE5ld3NsZXR0ZXIoKSB7XG4gICAgICAgIGlmICghJChcImRpdi5lbS1ib29raW5nLW1lc3NhZ2Utc3VjY2Vzc1wiKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoc2VuZE5ld3NsZXR0ZXIsIDEwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgJChcIiNOZXdzbGV0dGVyIGlucHV0W3R5cGU9XFxcInN1Ym1pdFxcXCJdXCIpLmNsaWNrKCk7XG4gICAgfVxuICAgIGlmICgkKFwiZGl2LmV2ZW50XCIpLmxlbmd0aCkge1xuICAgICAgICAkKFwiZGl2LmV2ZW50IC5lbS1ib29raW5nLXN1Ym1pdFwiKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJChcIiNuZXdzbGV0dGVyX2Zvcl9ldmVudFwiKS5wcm9wKCdjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZV8xID0gJCgnaW5wdXRbbmFtZT1cInVzZXJfbmFtZVwiXScpLnZhbCgpO1xuICAgICAgICAgICAgICAgIHZhciBtYWlsID0gJCgnaW5wdXRbbmFtZT1cInVzZXJfZW1haWxcIl0nKS52YWwoKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSAvKFteIF0qKS4rPyhbXiBdKi4qKS9nO1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IHJlZ2V4LmV4ZWMobmFtZV8xKTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZTEgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZTIgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgICAgICAkKCcjRS1NYWlsJykudmFsKG1haWwpO1xuICAgICAgICAgICAgICAgICQoJyNWb3JuYW1lJykudmFsKG5hbWUxKTtcbiAgICAgICAgICAgICAgICAkKCcjTmFjaG5hbWUnKS52YWwobmFtZTIpO1xuICAgICAgICAgICAgICAgIHNlbmROZXdzbGV0dGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0pKGpRdWVyeSk7XG4iLCIoZnVuY3Rpb24gKCQpIHtcbiAgICBpZiAobmV3IFJlZ0V4cChcIiN0YWxrLVswLTldKlwiKS50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSkge1xuICAgICAgICAkKFwiI1wiICsgJCh3aW5kb3cubG9jYXRpb24uaGFzaCkucGFyZW50KCkuYXR0cignaWQnKSArIFwiLWxhYmVsXCIpLmNsaWNrKCk7XG4gICAgICAgICQod2luZG93LmxvY2F0aW9uLmhhc2gpLmZpbmQoXCIudG9nZ2xlclwiKS5jbGljaygpO1xuICAgIH1cbn0pKGpRdWVyeSk7XG4iLCJcbiIsImZ1bmN0aW9uIHNjcm9sbFRvQW5jaG9yKGhyZWYsIGUpIHtcbiAgICB2YXIgJCA9IGpRdWVyeTtcbiAgICB2YXIgYm9udXMgPSAkKFwibmF2XCIpLm91dGVySGVpZ2h0KCk7XG4gICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxUb3A6ICQoaHJlZikub2Zmc2V0KCkudG9wIC0gYm9udXNcbiAgICB9LCAzMDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCdodG1sLCBib2R5Jykuc2Nyb2xsKCk7XG4gICAgICAgIH0sIDIzMCk7XG4gICAgfSk7XG4gICAgaWYgKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbn1cbihmdW5jdGlvbiAoJCkge1xuICAgICQoJy5hbmNob3Itc2Nyb2xsJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGhyZWYgPSAvIy4qLy5leGVjKCQodGhpcykuYXR0cignaHJlZicpKVswXTtcbiAgICAgICAgc2Nyb2xsVG9BbmNob3IoaHJlZiwgZSk7XG4gICAgfSk7XG59KShqUXVlcnkpO1xuIiwiKGZ1bmN0aW9uICgkKSB7XG4gICAgZnVuY3Rpb24gZ2V0TGlzdChvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdCA9PT0gdm9pZCAwKSB7IG9iamVjdCA9ICQoXCIuYWNmLXdlbW9kYS1hdXRob3JzXCIpOyB9XG4gICAgICAgIHZhciB2YWx1ZSA9IG9iamVjdC52YWwoKTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhcHBlbmRJbnB1dHMocm93cywgbmFtZSwgbGFiZWwsIGxpbmspIHtcbiAgICAgICAgaWYgKHJvd3MgPT09IHZvaWQgMCkgeyByb3dzID0gJChcIi5hY2Ytd2Vtb2RhLWF1dGhvcnMgfiAuZmllbGRzID4gZGl2LnJvd3NcIik7IH1cbiAgICAgICAgdmFyIHJvdyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcInJvd1wiKS5hcHBlbmRUbyhyb3dzKS5jc3MoXCJkaXNwbGF5XCIsIFwiZmxleFwiKTtcbiAgICAgICAgdmFyIGxhYmVsTmFtZSA9ICQoJzxsYWJlbD4nKS5hcHBlbmRUbyhyb3cpLnRleHQoJ05hbWUgZGVzIEF1dG9ycycpLmNzcyhcIm1hcmdpblwiLCBcIjFlbVwiKTtcbiAgICAgICAgJCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCI+JykuYWRkQ2xhc3MoXCJuYW1lXCIpLmFwcGVuZFRvKGxhYmVsTmFtZSkudmFsKG5hbWUpLm9uKCdjaGFuZ2UnLCB1cGRhdGVEYXRhKTtcbiAgICAgICAgdmFyIGxhYmVsTGFiZWwgPSAkKCc8bGFiZWw+JykuYXBwZW5kVG8ocm93KS50ZXh0KCcoVHdpdHRlciktTGFiZWwnKS5jc3MoXCJtYXJnaW5cIiwgXCIxZW1cIik7XG4gICAgICAgICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiPicpLmFkZENsYXNzKFwibGFiZWxcIikuYXBwZW5kVG8obGFiZWxMYWJlbCkudmFsKGxhYmVsKS5vbignY2hhbmdlJywgdXBkYXRlRGF0YSk7XG4gICAgICAgIHZhciBsYWJlbExpbmsgPSAkKCc8bGFiZWw+JykuYXBwZW5kVG8ocm93KS50ZXh0KCdMaW5rIGRlcyBMYWJlbHMnKS5jc3MoXCJtYXJnaW5cIiwgXCIxZW1cIik7XG4gICAgICAgICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiPicpLmFkZENsYXNzKFwibGlua1wiKS5hcHBlbmRUbyhsYWJlbExpbmspLnZhbChsaW5rKS5vbignY2hhbmdlJywgdXBkYXRlRGF0YSk7XG4gICAgICAgICQoJzxkaXY+JykuYXBwZW5kVG8ocm93KS50ZXh0KFwiQXV0b3IgRW50ZmVybmVuXCIpLmNsaWNrKHJlbW92ZUF1dGhvcikuYWRkQ2xhc3MoJ2J1dHRvbiBidXR0b24tcHJpbWFyeSBidXR0b24tbGFyZ2UnKS5jc3MoXCJtYXJnaW5cIiwgXCIxZW1cIikuY3NzKFwiYWxpZ24tc2VsZlwiLCBcImZsZXgtZW5kXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0RmllbGRzKGxpc3QsIGlucHV0cykge1xuICAgICAgICBpZiAobGlzdCA9PT0gdm9pZCAwKSB7IGxpc3QgPSBnZXRMaXN0KCk7IH1cbiAgICAgICAgaWYgKGlucHV0cyA9PT0gdm9pZCAwKSB7IGlucHV0cyA9ICQoXCIuYWNmLXdlbW9kYS1hdXRob3JzIH4gLmZpZWxkc1wiKTsgfVxuICAgICAgICBpbnB1dHMuaHRtbChcIlwiKTtcbiAgICAgICAgdmFyIHJvd3MgPSAkKFwiPGRpdj5cIikuYXBwZW5kVG8oaW5wdXRzKS5hZGRDbGFzcyhcInJvd3NcIik7XG4gICAgICAgICQobGlzdCkuZWFjaChmdW5jdGlvbiAoaSwgbGkpIHtcbiAgICAgICAgICAgIGFwcGVuZElucHV0cyhyb3dzLCBsaS5uYW1lLCBsaS5sYWJlbCwgbGkubGluayk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKFwiPGRpdj5cIikuYXBwZW5kVG8oaW5wdXRzKS50ZXh0KCdBdXRvciBIaW56dWbDvGdlbicpLmNsaWNrKGFkZE5ld0F1dGhvcikuYWRkQ2xhc3MoJ2J1dHRvbiBidXR0b24tcHJpbWFyeSBidXR0b24tbGFyZ2UnKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkTmV3QXV0aG9yKGV2ZW50KSB7XG4gICAgICAgIGFwcGVuZElucHV0cyh2b2lkIDAsIFwiXCIsIFwiXCIsIFwiXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVBdXRob3IoZXZlbnQsIGF1dGhvckZpZWxkKSB7XG4gICAgICAgIGlmIChhdXRob3JGaWVsZCA9PT0gdm9pZCAwKSB7IGF1dGhvckZpZWxkID0gJChcIi5hY2Ytd2Vtb2RhLWF1dGhvcnNcIik7IH1cbiAgICAgICAgdmFyIG9iamVjdCA9ICQoZXZlbnQudGFyZ2V0KS5wYXJlbnQoKTtcbiAgICAgICAgdmFyIG90aGVyID0gb2JqZWN0LnBhcmVudCgpO1xuICAgICAgICBvYmplY3QucmVtb3ZlKCk7XG4gICAgICAgIHZhciBpbnB1dHMgPSBvdGhlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICBpZiAoIWlucHV0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGF1dGhvckZpZWxkLnZhbChcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlucHV0cy50cmlnZ2VyKFwiY2hhbmdlXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoZXZlbnQsIGF1dGhvckZpZWxkKSB7XG4gICAgICAgIGlmIChhdXRob3JGaWVsZCA9PT0gdm9pZCAwKSB7IGF1dGhvckZpZWxkID0gJChcIi5hY2Ytd2Vtb2RhLWF1dGhvcnNcIik7IH1cbiAgICAgICAgdmFyIG9iamVjdCA9ICQoZXZlbnQudGFyZ2V0KS5wYXJlbnRzKCcucm93cycpO1xuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgICBvYmplY3QuY2hpbGRyZW4oJy5yb3cnKS5lYWNoKGZ1bmN0aW9uIChpLCByKSB7XG4gICAgICAgICAgICB2YXIgcm93ID0gJChyKTtcbiAgICAgICAgICAgIHZhciBuYW1lID0gcm93LmZpbmQoJy5uYW1lJykudmFsKCk7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSByb3cuZmluZCgnLmxhYmVsJykudmFsKCk7XG4gICAgICAgICAgICB2YXIgbGluayA9IHJvdy5maW5kKCcubGluaycpLnZhbCgpO1xuICAgICAgICAgICAgZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAnbmFtZSc6IG5hbWUsXG4gICAgICAgICAgICAgICAgJ2xhYmVsJzogbGFiZWwsXG4gICAgICAgICAgICAgICAgJ2xpbmsnOiBsaW5rXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGF1dGhvckZpZWxkLnZhbChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgfVxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGF1dGhvckZpZWxkID0gJChcIi5hY2Ytd2Vtb2RhLWF1dGhvcnNcIik7XG4gICAgICAgIHZhciBhdXRob3JJbnB1dHMgPSAkKFwiLmFjZi13ZW1vZGEtYXV0aG9ycyB+IC5maWVsZHNcIik7XG4gICAgICAgIGlmIChhdXRob3JGaWVsZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gZ2V0TGlzdCgpO1xuICAgICAgICAgICAgaW5pdEZpZWxkcyhsaXN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufShqUXVlcnkpKTtcbiIsIihmdW5jdGlvbiAoJCkge1xuICAgIGZ1bmN0aW9uIGluaXRDb2xvclBpY2tlcih3aWRnZXQpIHtcbiAgICAgICAgd2lkZ2V0LmZpbmQoJy5jb2xvci1maWVsZCcpLndwQ29sb3JQaWNrZXIoe1xuICAgICAgICAgICAgY2hhbmdlOiBfLnRocm90dGxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICAgICAgICAgfSwgNzAwLCB7IGxlYWRpbmc6IGZhbHNlIH0pLFxuICAgICAgICAgICAgcGFsZXR0ZXM6IFsnIzAwMDAwMCcsXG4gICAgICAgICAgICAgICAgJyNGRkZGRkYnLFxuICAgICAgICAgICAgICAgICcjRjlCMDAwJyxcbiAgICAgICAgICAgICAgICAnIzk3QzY2NicsXG4gICAgICAgICAgICAgICAgJyM1RkM0RTAnLFxuICAgICAgICAgICAgICAgICcjQzNEMjAwJyxcbiAgICAgICAgICAgICAgICAnIzc3QzRCMCcsXG4gICAgICAgICAgICAgICAgJyNGRkVEMDAnLFxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Gb3JtVXBkYXRlKGV2ZW50LCB3aWRnZXQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJFVkVOVDpcIiwgZXZlbnQsIHdpZGdldCk7XG4gICAgICAgIGluaXRDb2xvclBpY2tlcih3aWRnZXQpO1xuICAgIH1cbiAgICAkKGRvY3VtZW50KS5vbignd2lkZ2V0LWFkZGVkIHdpZGdldC11cGRhdGVkJywgb25Gb3JtVXBkYXRlKTtcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoJyN3aWRnZXRzLXJpZ2h0IC53aWRnZXQ6aGFzKC5jb2xvci1maWVsZCknKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGluaXRDb2xvclBpY2tlcigkKHRoaXMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KGpRdWVyeSkpO1xuIiwiKGZ1bmN0aW9uICgkKSB7XG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50TW9kZSkge1xuICAgICAgICAkKFwiYm9keVwiKS5hZGRDbGFzcyhcImZpeC1pbWFnZVwiKTtcbiAgICAgICAgJChcImJvZHlcIikuYWRkQ2xhc3MoXCJmaXgtZmxleGJveFwiKTtcbiAgICB9XG4gICAgaWYgKC9TYWZhcmkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgL0VkZ2UvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgKCEvQ2hyb21lLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSkge1xuICAgICAgICAkKFwiYm9keVwiKS5hZGRDbGFzcyhcImZpeC1pbWFnZVwiKTtcbiAgICB9XG59KShqUXVlcnkpO1xuIiwiKGZ1bmN0aW9uICgkKSB7XG4gICAgZnVuY3Rpb24gZ2V0TWV0YShuYW1lKSB7XG4gICAgICAgIHJldHVybiAkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJtZXRhW25hbWU9J1wiICsgbmFtZSArIFwiJ11cIikpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzd2FwX2F0dHIodGFnLCBhdHRyMSwgYXR0cjIpIHtcbiAgICAgICAgdmFyIGJ1YmJsZSA9IHRhZy5hdHRyKGF0dHIxKTtcbiAgICAgICAgdGFnLmF0dHIoYXR0cjEsIHRhZy5hdHRyKGF0dHIyKSk7XG4gICAgICAgIHRhZy5hdHRyKGF0dHIyLCBidWJibGUpO1xuICAgIH1cbiAgICB2YXIgdGFnID0gZ2V0TWV0YSgndmlld3BvcnQnKTtcbiAgICB2YXIgcG9zaXRpb24gPSAwO1xuICAgICQoZG9jdW1lbnQpLm9uKCdvcGVuLnpmLnJldmVhbCcsICdbZGF0YS1yZXZlYWxdJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBzd2FwX2F0dHIodGFnLCAnY29udGVudCcsICdkYXRhLWFsdC1jb250ZW50Jyk7XG4gICAgICAgIHBvc2l0aW9uID0gJChkb2N1bWVudCkuc2Nyb2xsVG9wKCk7XG4gICAgfSk7XG4gICAgJChkb2N1bWVudCkub24oJ2Nsb3NlZC56Zi5yZXZlYWwnLCAnW2RhdGEtcmV2ZWFsXScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3dhcF9hdHRyKHRhZywgJ2NvbnRlbnQnLCAnZGF0YS1hbHQtY29udGVudCcpO1xuICAgICAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxUb3A6IHBvc2l0aW9uXG4gICAgICAgIH0sICdmYXN0Jyk7XG4gICAgfSk7XG59KShqUXVlcnkpO1xuIl19
