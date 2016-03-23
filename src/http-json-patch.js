
var http = require('./http');

http.jsonPatch = function (url, data, config) {

	url = ( _isArray(url) ) ? joinPath.apply(null, url) : url;

	if( typeof url === 'object' ) {
		url.method = 'patch';
		return http(url);
	} else if( typeof url === 'string' ) {
		config = config ? config : {};
    config.method = 'patch';

		if( data ) {
      config.data = data;
			return http(url, config);
		} else {
			var patchOps = [],
  				addOp = function (patchOp) {
  					patchOps.push(patchOp);
  					return patchHandler;
  				},
  				patchHandler = {
  					add: function (path, value) {
  						return addOp({ op: 'add', path: path, value: value });
  					},
  					test: function (path, value) {
  						return addOp({ op: 'test', path: path, value: value });
  					},
  					replace: function (path, value) {
  						return addOp({ op: 'replace', path: path, value: value });
  					},
  					move: function (from, path) {
  						return addOp({ op: 'move', from: from, path: path });
  					},
  					copy: function (from, path) {
  						return addOp({ op: 'copy', from: from, path: path });
  					},
  					remove: function (path) {
  						return addOp({ op: 'remove', path: path });
  					},

  					flush: function () {
  						patchOps.splice(0, patchOps.length);
  						return patchHandler;
  					},

  					submit: function (data) {
  						data = data || patchOps;
              config.data = data;

  						return http(url, config);
  					}
  				};

			return patchHandler;
		}

	}
};

if (typeof define === 'function' && define.amd) {
	// AMD. Register as an anonymous module.
	define(['$http'], function () {
	  return http;
	});
} else {
	// Browser globals
	global.$http = http;
}
