
if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['$http'], function () {
      return require('./http');
    });
} else {
    // Browser globals
    global.Parole = require('./http');

    // if( !global.Parole ) {
    //   global.Parole = require('parole');
    // }
}
