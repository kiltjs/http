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

function resolveFunctions (o, args, this_arg) {
  for( var key in o ) {
    if( isFunction(o[key]) ) {
      o[key] = o[key].apply(this_arg, args);
    } else if( isObject(o[key]) ) {
      o[key] = resolveFunctions(o[key], args, this_arg);
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

function headersToTitleSlug(headers) {
  var _headers = {};

  for( var key in headers ) {
    _headers[ headerToTitleSlug(key) ] = headers[key];
  }

  return _headers;
}





function serializeParams (params, previous_levels) {
  var results = [];
  previous_levels = previous_levels ||[];

  for( var param in params ) {
    if( typeof params[param] === 'object' ) [].push.apply( results, serializeParams(params[param], previous_levels.concat(param) ) );
    else results.push( previous_levels.concat(param).reduce(function (key, param) {
      return key + ( key ? ('[' + param + ']') : param );
    }, '') + '=' + encodeURIComponent(params[param]) );
  }
  return results;
}




var arrayPush = Array.prototype.push;
var arraySlice = Array.prototype.slice;

function _sanitizePath(path, i, last) {
  if( i > 0 ) path = path.replace(/^\.*\//, '');
  if( !last ) path = path.replace(/\/$/, '');
  return path.split(/\/+/);
}

function _joinPaths (paths) {
  var last = paths.length - 1;
  return paths.reduce(function (result, path, i) {
    if( path === '.' ) return result;
    if( /^[a-z]+:\/\//.test(path) ) return [path];
    if( /^\//.test(path) ) return _sanitizePath(path, 0, i === last );

    path = path.replace(/\.\.\//g, function () {
      result = result.slice(0, -1);
      return '';
    }).replace(/\.\//, '');

    arrayPush.apply( result, _sanitizePath(path, i, i === last) );

    return result;

  }, []).join('/');
}

function _unraise (paths) {
  var result = [];

  paths.forEach(function (path) {
    if( !path ) return;

    // https://jsperf.com/array-prototype-push-apply-vs-concat/17
    if( path instanceof Array ) arrayPush.apply(result, _unraise(path) );
    else if( typeof path === 'string' ) result.push(path);
    else throw new Error('paths parts should be Array or String');
  });

  return result;
}

function joinPaths () {
  return _joinPaths( _unraise(arraySlice.call(arguments)) );
}

var http_defaults = {};
var makeRequest = function () {};
var Parole = typeof Promise !== 'undefined' ? Promise : function () {};

function _plainOptions (_options_pile, method) {
  var options_pile = _options_pile ? copy(_options_pile) : [];

  var plain_options = {},
      options = options_pile.shift();

  while( options ) {
    merge(plain_options, options);
    options = options_pile.shift();
  }

  if(method) plain_options.method = method;

  plain_options.url = joinPaths( _options_pile.reduce(function (paths, options) {
    if( !options.url ) return paths;

    if( options.url instanceof Function ) return paths.concat( options.url(plain_options) );

    return paths.concat(options.url);
  }, []) );

  return plain_options;
}

function http (url, _config, body) {

  var config = _plainOptions([http_defaults, _config || {}]);

  config = copy( isObject(url) ? url : config || {} );
  config.url = url === config ? config.url : url;
  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();
  config.body = body || config.body;

  if( !isString(config.url) ) throw new Error('url must be a string');

  config = resolveFunctions(config, [config]);

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serializeParams( config.params ).join('&');
  }

  var headers = copy(config.headers || {});

  if( config.json && !config.body ) {
    headers.contentType = headers.contentType || 'application/json';
    config.body = JSON.stringify(config.json);
  } else if( headers.contentType === 'application/json' && typeof config.body === 'object' ) {
    config.body = JSON.stringify(config.body);
  } else if( typeof config.body === 'object' &&
      !Blob.prototype.isPrototypeOf(config.body) &&
      !FormData.prototype.isPrototypeOf(config.body) ) {
    config.body = JSON.stringify(config.body);
    headers.contentType = headers.contentType || 'application/json';
  } else if( !headers.contentType ) headers.contentType || 'application/json';

  headers.accept = headers.accept || headers.contentType || 'application/json';

  config.headers = headersToTitleSlug(headers);

  var request = new Parole(function (resolve, reject) {
    makeRequest(config, resolve, reject);
  });

  request.config = config;

  return request;
}

http.responseData = function (response) {
  return response.data;
};

function httpBase (target, options, options_pile) {
  var requestMethod = function (method, hasData) {
        return hasData ? function (url, data, _options) {
          if( typeof url === 'object' ) { _options = data; data = url; url = null; }
          _options = Object.create(_options || {});
          if( url ) _options.url = url;
          _options = _plainOptions( _options ? options_pile.concat(_options) : options_pile, method );
          return http( _options.url, _options, data );
        } : function (url, _options, params) {
          if( typeof url === 'object' ) { params = _options; _options = url; url = null; }
          _options = Object.create(_options || {});
          if( url ) _options.url = url;
          if( params ) _options.params = params;
          _options = _plainOptions( _options ? options_pile.concat(_options) : options_pile, method );
          return http( _options.url, _options );
        };
      };

  return extend(target, {
    head: requestMethod('head'),
    get: requestMethod('get'),
    post: requestMethod('post', true),
    put: requestMethod('put', true),
    patch: requestMethod('patch', true),
    delete: requestMethod('delete'),
    base: function (url, _options) {
      var options = _options ? Object.create(_options) :{};
      options.url = url;
      return httpBase( requestMethod('get'), options, options_pile.concat(options) );
    },
    config: function (_options) {
      if( options === undefined ) return _plainOptions( [http_defaults].concat(this.options_pile).concat(options) );
      merge( options, _options );
    },
    responseData: http.responseData,
  });
}

http.base = httpBase;
httpBase(http, http_defaults, []);

http.usePromise = function (P) { Parole = P; return http; };
http.useRequest = function (request) {
  if( !isFunction(request) ) throw new Error('request should be a function');
  else makeRequest = request;
  return http;
};

http.config = function (options) {
  merge( http_defaults, options );
  return http;
};

module.exports = http;
