/* global ActiveXObject */

(function (root, http) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = http :
  typeof define === 'function' && define.amd ? define(function () { return http; }) :
  (root.$http = http);
})(this, (function (root, Promise, _isBrowser) { 'use strict';

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
      httpDefaults = {};

  function mapObject (o, iteratee, thisArg) {
    var result = {};
    for( var key in o ) {
      result[key] = iteratee.call(thisArg, o[key], key);
    }
    return result;
  }

  function _copy (src) {
    if( isArray(src) ) {
      return src.map(function (item) {
        return _copy(item);
      });
    }

    if( isObject(src) ) {
      return mapObject(src, function (item) {
        return _copy(item);
      });
    }

    return src;
  }

  function _extend (dest, src) {
    dest = dest || {};
    for( var key in src ) dest[key] = src[key];
    return dest;
  }

  function _mergeArrays(dest, src, concatArrays) {
    if( !concatArrays ) return src.map(_copy);
    [].push.apply(dest, src);
    for( var i = 0, n = src.length ; i < n ; i++ ) {
      dest.push( dest[i] ? _merge(dest[i], src[i]) : _copy(src[i]) );
    }
    return dest;
  }

  function _merge (dest, src, concatArrays) {
    if( typeof dest !== typeof src ) {
      if( isArray(src) ) dest = [];
      else if( typeof src === 'object' ) dest = {};
      else return src;
    }
    if( isArray(src) ) return _mergeArrays(dest, src, concatArrays);
    if( typeof src === 'object' ) {
      for( var key in src ) {
        dest[key] = _merge(dest[key], src[key]);
      }
      return dest;
    }
    return src;
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

  function _getXMLHeaders (request) {
    var headers = {};
    request.getAllResponseHeaders().split('\n').forEach(function (headerLine) {
      var matched = headerLine.match(/(.*?):(.*)/);
      if( matched ) {
        headers[headerToCamelCase(matched[1])] = matched[2].trim();
      }
    });

    return headers;
  }

  var parseData = {
    json: function (data) {
      return JSON.parse(data);
    }
  };

  function getFetchResponse (response, format) {
    var headers = {},
        iterator = response.headers.entries(),
        entry = iterator.next();

    while( entry && !entry.done ) {
      headers[headerToCamelCase(entry.value[0])] = entry.value[1];
      entry = iterator.next();
    }

    var type = parseContentType(headers.contentType);

    return ( response[format || type] ? response[format || type]() : response.text() ).then(function (data) {
      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: headers,
      };
    });
  }

  function fetchRequest (config, resolve, reject) {
    var options = { headers: new Headers(config.headers), redirect: 'follow', credentials: 'same-origin' };
    if( config.withCredentials ) options.credentials = 'include';
    if( config.credentials ) options.credentials = config.credentials;

    fetch(config.url, options).then(function (response) {
      getFetchResponse(response, config.format).then(resolve);
    }, function (response) {
      getFetchResponse(response, config.format).then(reject);
    });
  }

  function xmlRequest (config, resolve, reject) {

    var request = null;

    try { // Firefox, Opera 8.0+, Safari
      request = new XMLHttpRequest();
    } catch (e) { // Internet Explorer
      try { request = new ActiveXObject('Msxml2.XMLHTTP'); }  // jshint ignore:line
      catch (er) { request = new ActiveXObject('Microsoft.XMLHTTP'); }  // jshint ignore:line
    }
    if( request === null ) { throw 'Browser does not support HTTP Request'; }

    if( config.withCredentials || config.credentials === 'include' ) request.withCredentials = true;

    request.onreadystatechange = function() {
      if( request.readyState === 'complete' || request.readyState === 4 ) {
        // var type = parseContentType( request.getResponseHeader('Content-Type') ),
        var headers = _getXMLHeaders(request),
            type = parseContentType( headers.contentType ),
            response = {
              config: config,
              status: request.status,
              statusText: request.statusText,
              headers: headers,
              data: type === 'xml' ? request.responseXML : (parseData[type] ? parseData[type](request.responseText) : request.responseText),
            };

        if( request.status >= 200 && request.status < 400 ) {
          resolve( response );
        } else {
          reject( response );
        }
      }
    };

    request.open(config.method, config.url, true);

    if( config.headers ) {
      for( var key in config.headers ) {
        request.setRequestHeader( headerToTitleSlug(key), config.headers[key] );
      }
    }

    request.send( config.body );
  }

  var makeRequest = root.fetch ? fetchRequest : xmlRequest;

  function serializeParams (params) {
    var result = '';

    for( var param in params ) {
      result += ( result ? '&' : '' ) + param + '=' + encodeURIComponent(params[param]);
    }
    return result;
  }

  function http (url, config, data) {

    config = _copy( isObject(url) ? url : config || {} );
    config.url = url === config ? config.url : url;
    config.method = config.method && config.method.toUpperCase() || 'GET';
    config.timestamp = new Date().getTime();
    config.data = data || config.data;

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

    if( config.json && !config.body ) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      config.body = JSON.stringify(config.json);
    }

    var request = new Promise(function (resolve, reject) {
      makeRequest(config, resolve, reject);
    });

    request.config = config;

    return request;
  }

  http.responseData = function (response) {
    return response.data;
  };

  function _plainOptions (optionsPile, method) {
    optionsPile = optionsPile ? _copy(optionsPile) : [];

    var plainOptions = _copy(httpDefaults),
        options = optionsPile.shift();

    plainOptions.method = method;

    while( options ) {
      _merge(plainOptions, options);
      options = optionsPile.shift();
    }

    return plainOptions;
  }

  function useBasePath (_basePath) {
    return function (path) {
      return ( _basePath ? (_basePath.replace(/\/$/, '') + '/') : '' ) + path.replace(/^\//, '');
    };
  }

  function httpBase (target, _basePath, optionsPile) {
    var fullPath = useBasePath(_basePath),
        requestMethod = function (method, hasData) {
          return hasData ? function (path, data, options) {
            return http( fullPath(path), _plainOptions( optionsPile.concat(options), method ), data );
          } : function (path, options, data) {
            return http( fullPath(path), _plainOptions( optionsPile.concat(options), method ), data );
          };
        };

    target = target || requestMethod('get');

    return _extend(target, {
      head: requestMethod('head'),
      get: requestMethod('get'),
      post: requestMethod('post', true),
      put: requestMethod('put', true),
      patch: requestMethod('patch', true),
      delete: requestMethod('delete'),
      base: function (path, options) {
        return httpBase( target, fullPath(path), optionsPile.concat(options || {}) );
      },
      config: function (options) {
        if( options === undefined ) return _plainOptions( optionsPile );
        _merge( optionsPile[optionsPile.length - 1], options );
      },
      responseData: http.responseData,
    });
  }

  http.base = httpBase;
  httpBase(http, null, [{}]);

  http.usePromise = function (P) { Promise = P; };
  http.useRequest = function (request) {
    if( request === 'fetch' ) makeRequest = fetchRequest;
    else if( request === 'xml' ) makeRequest = xmlRequest;
    else if( !isFunction(request) ) throw new Error('request should be `fetch`, `xml` or a function');
    else makeRequest = request;
  };

  return http;

})(this, this.Promise, typeof window !== 'undefined' && window === this) );
