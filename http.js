/* global require, ActiveXObject */

(function (root, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (root.$http = factory());
})(this, (function (root, Promise, isBrowser, require) { return function () { 'use strict';

  var isType = function (type, o) {
        return o ? typeof o === type : function (_o) {
          return typeof _o === type;
        };
      },
      isObject = function (o) {
        return o !== null && typeof o === 'object';
      },
      isArray = Array.isArray || function (o) {
        return o instanceof Array;
      },
      isString = isType('string'),
      isFunction = isType('function'),
      arrayShift = [].shift;

  function mapObject (o, iteratee) {
    var result = {};
    for( var key in o ) {
      result[key] = iteratee(o[key], key);
    }
    return result;
  }

  function copy (src) {
    if( isArray(src) ) {
      return src.map(function (item) {
        return copy(item);
      });
    }

    if( isObject(src) ) {
      return mapObject(src, function (item) {
        return copy(item);
      });
    }

    return src;
  }

  function merge () {
    var dest = arrayShift.call(arguments),
        src = arrayShift.call(arguments),
        key;

    while( src ) {

      if( typeof dest !== typeof src ) {
          dest = isArray(src) ? [] : ( isObject(src) ? {} : src );
      }

      if( isObject(src) ) {

        for( key in src ) {
          if( src[key] === undefined ) {
            dest[key] = undefined;
          } else if( isArray(dest[key]) ) {
            [].push.apply(dest[key], src[key]);
          } else if( isObject(dest[key]) ) {
            dest[key] = merge(dest[key], src[key]);
          } else {
            dest[key] = src[key];
          }
        }
      }
      src = arrayShift.call(arguments);
    }

    return dest;
  }

  function resolveFunctions (o, args, thisArg) {
    for( var key in o ) {
      if( isFunction(o[key]) ) {
        o[key] = o[key].apply(thisArg, args || []);
      } else if( isObject(o[key]) ) {
        o[key] = resolveFunctions(o[key], args, thisArg);
      }
    }
    return o;
  }

  var RE_contentType = /([^\/]+)\/([^+]+\+)?([^;]*)/;
  function parseContentType(contentType) {
    var matches = contentType && contentType.match(RE_contentType);
    return matches ? matches[3] : 'text';
  }

  function headerToCamelCase(text) {
    var key = text[0].toLowerCase() + text.substr(1);
    return key.replace(/([a-z])-([a-zA-Z])/g, function (match, lower, upper) {
      return lower + upper.toUpperCase();
    });
  }

  function headerToTitleSlug(text) {
    // console.log('headerToTitleSlug', text);
    var key = text.replace(/([a-z])([A-Z])/g, function (match, lower, upper) {
        return lower + '-' + upper;
    });
    key = key[0].toUpperCase() + key.substr(1);

    return key;
  }

  function _getHeaders (request) {
    var headers = {};
    request.getAllResponseHeaders().replace(/\s*([^\:]+)\s*\:\s*([^\;\n]+)/g, function (match, key, value) {
        headers[headerToCamelCase(key)] = value.trim();
    });

    return headers;
  }

  function headersGetter (request) {
    var headersCache;
    return function () {
      if( !headersCache ) headersCache = _getHeaders(request);
      return headersCache;
    };
  }

  var parseData = {
    json: function (data) {
      return JSON.parse(data);
    }
  };

  var makeRequest = root.fetch ? function (config, onSuccess, onError) {
    return fetch( new Request(config.url, {
      headers: new Headers(config.headers)
    }) ).then(function (response) {
      var headers = {},
          iterator = response.headers.entries(),
          entry = iterator.next();
      while( entry ) {
        headers[headerToCamelCase(entry.value[0])] = entry.value[1];
        entry = iterator.next();
      }

      return response[config.format || parseContentType(headers.contentType)]().then(function (data) {
        response.data = data;
        return response;
      });
      // onSuccess({ ok: true, headers: response.headers });
    }, onError);
  } : ( isBrowser ? function (config, resolve, reject) {

    var request = null;

    try { // Firefox, Opera 8.0+, Safari
      request = new XMLHttpRequest();
    } catch (e) { // Internet Explorer
      try { request = new ActiveXObject('Msxml2.XMLHTTP'); }  // jshint ignore:line
      catch (er) { request = new ActiveXObject('Microsoft.XMLHTTP'); }  // jshint ignore:line
    }
    if( request === null ) { throw 'Browser does not support HTTP Request'; }

    request.onreadystatechange = function(){
      if( request.readyState === 'complete' || request.readyState === 4 ) {
        var headers = headersGetter(request),
            type = parseContentType(headers.contentType);
        var response = {
          config: config,
          data: type === 'xml' ? request.responseXML : (parseData[type] ? parseData[type](request.responseText) : request.responseText),
          status: request.status,
          headers: headersGetter(request)
        };
        if( request.status >= 200 && request.status < 400 ) {
          resolve( response );
        } else {
          reject( response );
        }
      }
    };

  } : require('./http-request') );

  function serializeParams (params) {
    var result = '';

    for( var param in params ) {
      result += ( result ? '&' : '' ) + param + '=' + encodeURIComponent(params[param]);
    }
    return result;
  }

  function http (url, config) {

    config = copy( isObject(url) ? url : config || {} );
    config.url = url === config ? config.url : url;
    config.method = config.method.toUpperCase() || 'GET';
    config.timestamp = new Date().getTime();

    var headers = {};
    config.headers = config.headers || {};
    for( var key in config.headers ) {
      headers[ headerToTitleSlug(key) ] = config.headers[key];
    }
    config.headers = headers;

    if( !isString(config.url) ) throw new Error('url must be a string');

    config = resolveFunctions(config);

    if( config.params ) {
      config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serializeParams( config.params );
    }

    var request = new Promise(function (resolve, reject) {
      makeRequest(config, resolve, reject);
    });

    request.config = config;

    return request;
  }

  // function httpBase () {
  //
  // }

  http.responseData = function (response) {
    return response.data;
  };

  http.usePromise = function (P) { Promise = P; };

  return http;

}; })(this, this.Promise, typeof window !== 'undefined' && window === this, require) );
