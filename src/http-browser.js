
if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['$http'], function () {
      return require('./http');
    });
} else {
    // Browser globals
    global.$http = require('./http');

    if( !global.$q ) {
      global.$q = require('q-promise');
    }
}
