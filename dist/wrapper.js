'use strict';

var isType = function (type, o) {
      return o ? typeof o === type : function (_o) {
        return typeof _o === type;
      };
    };

function isObject (o) {
  return o !== null && typeof o === 'object';
}

var isArray = Array.isArray || function (o) {
  return o instanceof Array;
};

var isString = isType('string');
var isFunction = isType('function');

function mapObject (o, iteratee, thisArg) {
  var result = {};
  for( var key in o ) {
    result[key] = iteratee.call(thisArg, o[key], key);
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

function extend (dest, src) {
  dest = dest || {};
  for( var key in src ) dest[key] = src[key];
  return dest;
}

function _mergeArrays(dest, src, concatArrays) {
  if( !concatArrays ) return src.map(copy);
  [].push.apply(dest, src);
  for( var i = 0, n = src.length ; i < n ; i++ ) {
    dest.push( dest[i] ? merge(dest[i], src[i]) : copy(src[i]) );
  }
  return dest;
}

function merge (dest, src, concatArrays) {
  if( typeof dest !== typeof src ) {
    if( isArray(src) ) dest = [];
    else if( typeof src === 'object' ) dest = {};
    else return src;
  }
  if( isArray(src) ) return _mergeArrays(dest, src, concatArrays);
  if( typeof src === 'object' ) {
    for( var key in src ) {
      dest[key] = merge(dest[key], src[key]);
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

function headerToTitleSlug(text) {
  // console.log('headerToTitleSlug', text);
  var key = text.replace(/([a-z])([A-Z])/g, function (match, lower, upper) {
      return lower + '-' + upper;
  });
  key = key[0].toUpperCase() + key.substr(1);

  return key;
}



function serializeParams (params) {
  var result = '';

  for( var param in params ) {
    result += ( result ? '&' : '' ) + param + '=' + encodeURIComponent(params[param]);
  }
  return result;
}

var httpDefaults = {};
var makeRequest = function () {};
var Parole = typeof Promise !== 'undefined' ? Promise : function () {};

function http (url, config, body) {

  config = copy( isObject(url) ? url : config || {} );
  config.url = url === config ? config.url : url;
  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();
  config.body = body || config.body;

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
  } else if( headers['Content-Type'] === 'application/json' && typeof config.body === 'object' ) {
    config.body = JSON.stringify(config.json);
  } else if( typeof config.body === 'object' &&
      !Blob.prototype.isPrototypeOf(config.body) &&
      !FormData.prototype.isPrototypeOf(config.body) ) {
    config.body = JSON.stringify(config.body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  var request = new Parole(function (resolve, reject) {
    makeRequest(config, resolve, reject);
  });

  request.config = config;

  return request;
}

http.responseData = function (response) {
  return response.data;
};

function _plainOptions (optionsPile, method) {
  optionsPile = optionsPile ? copy(optionsPile) : [];

  var plainOptions = copy(httpDefaults),
      options = optionsPile.shift();

  while( options ) {
    merge(plainOptions, options);
    options = optionsPile.shift();
  }

  plainOptions.method = method;

  return plainOptions;
}

function useBasePath (_basePath) {
  return function (path) {
    return ( _basePath ? (_basePath.replace(/\/$/, '') + '/') : '' ) + ( path ? ( _basePath ? path.replace(/^\//, '') : path ) : '' );
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

  return extend(target, {
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
      merge( optionsPile[optionsPile.length - 1], options );
    },
    responseData: http.responseData,
  });
}

http.base = httpBase;
httpBase(http, null, [{}]);

http.usePromise = function (P) { Parole = P; return http; };
http.useRequest = function (request) {
  if( !isFunction(request) ) throw new Error('request should be a function');
  else makeRequest = request;
  return http;
};

http.config = function (options) {
  merge( httpDefaults, options );
  return http;
};

module.exports = http;
