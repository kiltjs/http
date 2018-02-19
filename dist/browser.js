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

function toUnderscoreCase (text) {
  return text.replace(/-/g, '_').replace(/([a-z])([A-Z])/, function (matched, a, b) { return a + '_' + b; }).toLowerCase();
}

function toCamelCase (text) {
  return text.replace(/([a-z])[-_]([a-z])/g, function (matched, a, b) { return a + b.toUpperCase(); });
}

function toHeaderCase (text) {
  var key = text.replace(/_/g, '-').replace(/([a-z])([A-Z])/, function (matched, a, b) { return a + '-' + b; });
  return key[0].toUpperCase() + key.substr(1).toLowerCase().replace(/-[a-z]/g, function (matched) { return matched.toUpperCase(); });
}

function _passThrought (value) {
  return value;
}

var case_formatters = {
  underscore: toUnderscoreCase,
  camel: toCamelCase,
  header: toHeaderCase,
};

function mapObject (o, iteratee, thisArg, mapFormatter) {
  var result = {};
  mapFormatter = mapFormatter || _passThrought;
  for( var key in o ) {
    result[mapFormatter(key)] = iteratee.call(thisArg, o[key], key);
  }
  return result;
}

function copy (src, mapFormatter) {
  if( typeof mapFormatter === 'string' ) mapFormatter = case_formatters[mapFormatter];

  if( isArray(src) ) {
    return src.map(function (item) {
      return copy(item, mapFormatter);
    });
  }

  if( isObject(src) ) {
    return mapObject(src, function (item) {
      return copy(item, mapFormatter);
    }, src, mapFormatter);
  }

  return src;
}

function extend (dest, src) {
  dest = dest || {};
  for( var key in src ) dest[key] = src[key];
  return dest;
}

function _mergeArrays(dest, src, concatArrays) {
  if( !concatArrays ) return src.map(function (item) { return copy(item); });
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

var RE_contentType = /([^/]+)\/([^+]+\+)?([^;]*)/;
function parseContentType(contentType) {
  var matches = contentType && contentType.match(RE_contentType);
  return matches ? matches[3] : 'text';
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
    if( /^[a-z]+:\/\//.test(path) ) return [i === last ? path : path.replace(/\/$/, '')];
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

function keysTobrackets (keys) {
  return keys.reduce(function (result, key, i) {
    return result + (i ? ( '[' + key + ']' ) : key);
  }, '');
}

function _serialize (data, params, keys) {

  if( typeof data === 'object' ) {
    if( Array.isArray(data) ) {
      for( var i = 0, n = data.length; i < n ; i++ ) {
        _serialize( data[i], params, keys.concat( typeof data[i] === 'object' ? i : '' ) );
      }
    } else {
      for( var k in data ) {
        _serialize( data[k], params, keys.concat(k) );
      }
    }
  } else {
    params.push( keysTobrackets(keys) + '=' + encodeURIComponent('' + data) );
    // params.push( keysTobrackets(keys) + '=' + '' + data );
  }

  return params;
}

function serializeQS (data) {
  // eslint-disable-next-line
  // console.log('serialize', data, _serialize(data, [], []) );
  return _serialize(data, [], []).join('&');
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

function getInterceptorsProcessor (interceptors, resolve, reject, is_error) {
  function processInterceptor (_res, interceptor) {
    if( interceptor ) {
      try{
        processInterceptor( resolve( interceptor(_res) ), interceptors.shift() );
      } catch (err) {
        reject(err);
      }
    } else (is_error ? reject : resolve)(_res);
  }
  return function (res) {
    return processInterceptor( res, interceptors.shift() );
  };
}

function http$1 (url, _config, body) {

  var config = _plainOptions([http_defaults, _config || {}]);

  config = copy( isObject(url) ? url : config || {} );
  config.url = url === config ? config.url : url;
  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();
  config.body = body || config.body;

  if( !isString(config.url) ) throw new Error('url must be a string');

  var interceptors = config.interceptors || [];
  delete config.interceptors;

  config = resolveFunctions(config, [config]);

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serializeQS( config.params ).join('&');
  }

  var headers = copy(config.headers || {}, 'underscore');

  if( config.json && !config.body ) {
    headers.content_type = headers.content_type || 'application/json';
    config.body = JSON.stringify(config.json);
  } else if( headers.content_type === 'application/json' && typeof config.body === 'object' ) {
    config.body = JSON.stringify(config.body);
  } else if( typeof config.body === 'object' &&
      !Blob.prototype.isPrototypeOf(config.body) &&
      !FormData.prototype.isPrototypeOf(config.body) ) {
    config.body = JSON.stringify(config.body);
    headers.content_type = headers.content_type || 'application/json';
  } else if( !headers.content_type ) headers.content_type || 'application/json';

  headers.accept = headers.accept || headers.content_type || 'application/json';

  config.headers = copy(headers, 'header');

  var req_interceptors = [],
      req_error_interceptors = [],
      res_interceptors = [],
      res_error_interceptors = [];

  interceptors.forEach(function (interceptor) {
    if( interceptor.request ) req_interceptors.push(interceptor.request);
    if( interceptor.requestError ) req_error_interceptors.push(interceptor.requestError);
    if( interceptor.response ) res_interceptors.push(interceptor.response);
    if( interceptor.responseError ) res_error_interceptors.push(interceptor.responseError);
  });

  var request = new Parole(function (resolve, reject) {
        if( req_interceptors.length ) getInterceptorsProcessor(req_interceptors, resolve, reject)(config);
        else resolve(config);
      })
      .catch(function (reason) {
        if( req_error_interceptors.length ) {
          return new Parole(function (resolve, reject) {
            getInterceptorsProcessor(req_error_interceptors, resolve, reject, true)(reason);
          });
        } else throw reason;
      })
      .then(function (config) {
        return new Parole(function (resolve, reject) {
          makeRequest(config,
            res_interceptors.length ? getInterceptorsProcessor(res_interceptors, resolve, reject) : resolve,
            res_error_interceptors.length ? getInterceptorsProcessor(res_error_interceptors, resolve, reject) : reject
          );
        });
      });

  request.config = config;

  return request;
}

http$1.responseData = function (response) {
  return response.data;
};

function httpBase (target, options, options_pile) {
  var requestMethod = function (method, hasData) {
        return hasData ? function (url, data, _options) {
          if( typeof url === 'object' ) { _options = data; data = url; url = null; }
          _options = Object.create(_options || {});
          if( url ) _options.url = url;
          _options = _plainOptions( _options ? options_pile.concat(_options) : options_pile, method );
          return http$1( _options.url, _options, data );
        } : function (url, _options, params) {
          if( typeof url === 'object' ) { params = _options; _options = url; url = null; }
          _options = Object.create(_options || {});
          if( url ) _options.url = url;
          if( params ) _options.params = params;
          _options = _plainOptions( _options ? options_pile.concat(_options) : options_pile, method );
          return http$1( _options.url, _options );
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
      if( options === undefined ) return _plainOptions( this.options_pile.concat(options) );
      merge( options, _options );
    },
    addInterceptor: function (interceptor_definitions) {
      options.interceptors = options.interceptors || [];
      options.interceptors.push(interceptor_definitions);
    },
    responseData: http$1.responseData,
  });
}

http$1.base = httpBase;
httpBase(http$1, http_defaults, []);

http$1.usePromise = function (P) { Parole = P; return http$1; };
http$1.useRequest = function (request) {
  if( !isFunction(request) ) throw new Error('request should be a function');
  else makeRequest = request;
  return http$1;
};

http$1.config = function (options) {
  merge( http_defaults, options );
  return http$1;
};

/* global ActiveXObject */

var parseData = {
  json: function (data) {
    return JSON.parse(data);
  }
};

function _getXMLHeaders (request) {
  var headers = {};
  request.getAllResponseHeaders().split('\n').forEach(function (headerLine) {
    var matched = headerLine.match(/(.*?):(.*)/);
    if( matched ) {
      headers[toUnderscoreCase(matched[1])] = matched[2].trim();
    }
  });

  return headers;
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
          type = parseContentType( headers.content_type ),
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
      request.setRequestHeader( key, config.headers[key] );
    }
  }

  request.send( config.body );
}

http$1.useRequest(xmlRequest);

module.exports = http$1;
