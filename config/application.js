/**
 * Application configuration + some helpers for debug / log purposes.
 *
 * Note that don't use 'use strict' with this file, it will broke those helpers...
 */

module.exports = {
  appName: 'Kalendoc API',
  consultingTimes: [5,10,15,20,30,45,60],
  appURL:'kalendoc.com/',
  "load-db":{
    _hookTimeout:600000
  }
};

Object.defineProperty(global, '__stack', {
  get: function() {
    var orig = Error.prepareStackTrace;

    Error.prepareStackTrace = function(_, stack) {
      return stack;
    };

    var err = new Error;

    Error.captureStackTrace(err, arguments.callee);

    var stack = err.stack;

    Error.prepareStackTrace = orig;

    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function() {
    return __stack[1].getLineNumber();
  }
});

Object.defineProperty(global, '__function', {
  get: function() {
    return __stack[1].getFunctionName();
  }
});
