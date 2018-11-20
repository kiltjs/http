'use strict';

var _isType = function (type, o) {
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

var isString = _isType('string');
var isFunction = _isType('function');

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

function _mergeArrays(dest, src, concat_arrays) {
  if( !concat_arrays ) return src.map(function (item) { return copy(item); });
  [].push.apply(dest, src.map(function (item) { return copy(item); }) );
  // for( var i = 0, n = src.length ; i < n ; i++ ) {
  //   dest.push( dest[i] ? merge(dest[i], src[i], concat_arrays) : copy(src[i]) );
  // }
  return dest;
}

function merge (dest, src, concat_arrays) {
  if( typeof dest !== typeof src ) {
    if( isArray(src) ) dest = [];
    else if( typeof src === 'object' ) dest = {};
    else return src;
  }
  if( isArray(src) ) return _mergeArrays(dest, src, concat_arrays);
  if( typeof src === 'object' ) {
    for( var key in src ) {
      dest[key] = merge(dest[key], src[key], concat_arrays);
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


var arrayPush = Array.prototype.push,
    arraySlice = Array.prototype.slice;

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

function plainOptions (_options_pile, _method) {
  var options_pile = _options_pile ? copy(_options_pile) : [];

  var plain_options = {},
      options = options_pile.shift();

  while( options ) {
    merge(plain_options, options, true);
    options = options_pile.shift();
  }

  // if(method) plain_options.method = method;

  // plain_options.url = joinPaths( _options_pile.reduce(function (paths, options) {
  //   if( !options.url ) return paths;
  //
  //   if( options.url instanceof Function ) return paths.concat( options.url(plain_options) );
  //
  //   return paths.concat(options.url);
  // }, []) );

  return plain_options;
}

function _keysTobrackets (keys) {
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
    params.push( _keysTobrackets(keys) + '=' + encodeURIComponent('' + data) );
    // params.push( keysTobrackets(keys) + '=' + '' + data );
  }

  return params;
}

function serialize (data) {
  // eslint-disable-next-line
  // console.log('serialize', data, _serialize(data, [], []) );
  return _serialize(data, [], []).join('&');
}

var http_defaults = {},
    _makeRequest = function () {};

var Parole = typeof Promise !== 'undefined' ? Promise : function () {};

function _getInterceptorsProcessor (interceptors, resolve, reject, is_error) {
  var running_error = is_error === true;

  function _processInterceptor (_res, interceptor) {
    if( !interceptor ) return (running_error ? reject : resolve)(_res);

    var result = undefined;

    try{
      result = interceptor(_res);
      if( result === undefined ) result = _res;
      else running_error = false;
    } catch (err) {
      result = err;
      running_error = true;
    }

    if( running_error !== is_error ) (running_error ? reject : resolve)(_res);
    else _processInterceptor(result, interceptors.shift());
  }

  return function (res) {
    _processInterceptor( res, interceptors.shift() );
  };
}

var isBlob = typeof Blob === 'function' ? function (x) {
  return Blob.prototype.isPrototypeOf(x);
} : function () { return false; };

var isFormData = typeof FormData === 'function' ? function (x) {
  return FormData.prototype.isPrototypeOf(x);
} : function () { return false; };

function http (url, _config, data) {
  if( isObject(url) ) {
    data = _config;
    _config = url;
    url = null;
  }

  var config = plainOptions([http_defaults, _config || {}, url ? { url: [url] } : {}]);

  if( config.url instanceof Array ) config.url = joinPaths(config.url);

  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();

  if( !isString(config.url) ) throw new Error('url must be a string');

  data = data || config.data || config.json;

  var is_json = data && 'json' in config || (
    typeof data === 'object' && !isBlob(data) && !isFormData(data)
  );
  config.data = data;

  var interceptors = config.interceptors || [];
  delete config.interceptors;

  config = resolveFunctions(config, [config]);

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serialize( config.params );
  }

  var headers = copy(config.headers || {}, 'underscore');

  if( config.auth ) headers.authorization = 'Basic ' + btoa(config.auth.user + ':' + config.auth.pass);

  if( is_json && !headers.content_type ) headers.content_type = 'application/json';
  if( 'content_type' in headers && !headers.content_type ) delete headers.content_type;

  headers.accept = headers.accept || headers.content_type || 'application/json';

  config.headers = copy(headers, 'header');

  var req_interceptors = [],
      // req_error_interceptors = [],
      res_interceptors = [],
      res_error_interceptors = [];

  interceptors.forEach(function (interceptor) {
    if( interceptor.request ) req_interceptors.push(interceptor.request);
    // if( interceptor.requestError ) req_error_interceptors.push(interceptor.requestError);
    if( interceptor.response ) res_interceptors.push(interceptor.response);
    if( interceptor.responseError ) res_error_interceptors.push(interceptor.responseError);
  });

  var request = null;

  var controller = new Parole(function (resolve, reject) {
        if( req_interceptors.length ) _getInterceptorsProcessor(req_interceptors, resolve, reject)(config);
        else resolve(config);
      })
      .then(function (config) {
        return new Parole(function (resolve, reject) {
          request = _makeRequest(config,
            res_interceptors.length ? _getInterceptorsProcessor(res_interceptors, resolve, reject, false) : resolve,
            res_error_interceptors.length ? _getInterceptorsProcessor(res_error_interceptors, resolve, reject, true) : reject
          );
        });
      });

  controller.config = config;
  controller.abort = function () {
    if( request ) request.abort();
  };

  return controller;
}

http.responseData = function (response) {
  return response.data;
};

function _httpBase (target, options, options_pile) {
  var _requestMethod = function (method, has_data) {
    return has_data ? function (url, data, _options) {

      return http( plainOptions(
        options_pile.concat(_options || {}).concat({ method: method, url: [url] })
      ), data );

    } : function (url, _options) {

      return http( plainOptions(
        options_pile.concat(_options || {}).concat({ method: method, url: [url] })
      ) );

    };
  };

  return extend(target, {
    head: _requestMethod('head'),
    get: _requestMethod('get'),
    post: _requestMethod('post', true),
    put: _requestMethod('put', true),
    patch: _requestMethod('patch', true),
    delete: _requestMethod('delete'),
    options: _requestMethod('options'), // for node
    base: function (url, _options) {
      var options = _options ? Object.create(_options) :{};
      options.url = [url];
      return _httpBase( _requestMethod('get'), options, options_pile.concat(options) );
    },
    config: function (_options) {
      if( _options === undefined ) return plainOptions( options_pile.concat(options) );
      merge( options, _options );
    },
    addInterceptor: function (interceptor_definitions) {
      options.interceptors = options.interceptors || [];
      options.interceptors.push(interceptor_definitions);
    },
    responseData: http.responseData,
    useRequest: function (__makeRequest) {
      if( !isFunction(__makeRequest) ) throw new Error('_makeRequest should be a function');
      _makeRequest = __makeRequest;
      return target;
    },
  });
}

http.base = _httpBase;
_httpBase(http, http_defaults, []);

http.usePromise = function (P) { Parole = P; return http; };
http.useRequest = function (__makeRequest) {
  if( !isFunction(__makeRequest) ) throw new Error('_makeRequest should be a function');
  _makeRequest = __makeRequest;
  return http;
};

http.config = function (options) {
  merge( http_defaults, options );
  return http;
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

  var xhr = null;

  try { // Firefox, Opera 8.0+, Safari
    xhr = new XMLHttpRequest();
  } catch (e) { // Internet Explorer
    try { xhr = new ActiveXObject('Msxml2.XMLHTTP'); }  // jshint ignore:line
    catch (er) { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }  // jshint ignore:line
  }
  if( xhr === null ) { throw 'Browser does not support HTTP Request'; }

  if( config.with_credentials || config.withCredentials || config.credentials === 'include' ) xhr.withCredentials = true;

  xhr.onreadystatechange = function() {
    if( xhr.readyState === 'complete' || xhr.readyState === 4 ) {
      // var type = parseContentType( request.getResponseHeader('Content-Type') ),
      var headers = _getXMLHeaders(xhr),
          type = parseContentType( headers.content_type ),
          response = {
            config: config,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
            data: type === 'xml' ? xhr.responseXML : (parseData[type] ? parseData[type](xhr.responseText) : xhr.responseText),
          };

      if( xhr.status >= 200 && xhr.status < 400 ) {
        resolve( response );
      } else {
        reject( response );
      }
    }
  };

  if( 'timeout' in config ) xhr.timeout = config.timeout;
  xhr.ontimeout = function () {
    reject('timeout');
  };

  xhr.open(config.method, config.url, true);

  if( config.headers ) {
    for( var key in config.headers ) {
      xhr.setRequestHeader( key, config.headers[key] );
    }
  }

  xhr.send( config.body );

  return {
    abort: function () {
      xhr.abort();
    },
  };
}

function getFetchResponse (response, config) {
  var headers = {},
      iterator = response.headers.entries(),
      entry = iterator.next();

  while( entry && !entry.done ) {
    headers[toUnderscoreCase(entry.value[0])] = entry.value[1];
    entry = iterator.next();
  }

  var type = parseContentType(headers.content_type);

  return ( response[config.format || type] ? response[config.format || type]() : response.text() ).then(function (data) {
    return {
      config: config,
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: headers,
    };
  });
}

function fetchRequest (config, resolve, reject) {
  var controller = new AbortController;

  if( config.timeout ) {
    setTimeout(function () {
      reject('timeout');
    }, config.timeout);
  }

  var _config = extend( copy(config) , {
    headers: new Headers(config.headers),
    redirect: 'follow',
  });

  if( config.withCredentials ) {
    _config.mode = 'cors';
    _config.credentials = 'include';
  }

  fetch(config.url, { signal: controller.signal }, _config ).then(function (response) {
    getFetchResponse(response, config).then(response.ok ? resolve : reject);
  }, function (response) {
    getFetchResponse(response, config).then(reject);
  });

  return {
    abort: function () {
      controller.abort();
    },
  };
}

var useRequest = http.useRequest,
    requests = { xml: xmlRequest, fetch: fetchRequest };

http.useRequest = function (request) {
  if( typeof request === 'string' ) {
    if( !requests[request] ) throw new Error('request type `' + request + '` missing');
    useRequest( requests[request] );
  } else if( !Function.prototype.isPrototypeOf(request) ) throw new Error('request should be a function');
  else useRequest( request );
};

useRequest( window.fetch ? requests.fetch : requests.xml );

module.exports = http;
