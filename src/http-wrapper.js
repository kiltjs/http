
import {copy, extend, merge, isObject, isString, isFunction, resolveFunctions, joinPaths} from './utils';
import serialize from './serialize';

var http_defaults = {},
    makeRequest = function () {},
    Parole = typeof Promise !== 'undefined' ? Promise : function () {};

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

  function _processInterceptor (_res, interceptor) {
    var result = undefined;
    if( interceptor ) {
      try{
        result = interceptor(_res);
        is_error = false;
      } catch (err) {
        is_error = true;
        processInterceptor( err );
      }

      if( result !== undefined ) processInterceptor( result );

    } else (is_error ? reject : resolve)(_res);
  }

  function processInterceptor (res) {
    return _processInterceptor( res, interceptors.shift() );
  }

  return processInterceptor;
}

var isBlob = typeof Blob === 'function' ? function (x) {
  return Blob.prototype.isPrototypeOf(x);
} : function () { return false; };

var isFormData = typeof FormData === 'function' ? function (x) {
  return FormData.prototype.isPrototypeOf(x);
} : function () { return false; };

function http (url, _config, body) {

  var config = _plainOptions([http_defaults, _config || {}]);

  config = copy( isObject(url) ? url : config || {} );
  config.url = url === config ? config.url : url;
  config.method = config.method ? config.method.toUpperCase() : 'GET';
  config.timestamp = new Date().getTime();

  if( !isString(config.url) ) throw new Error('url must be a string');

  var interceptors = config.interceptors || [];
  delete config.interceptors;

  config = resolveFunctions(config, [config]);
  config.body = body || config.body;

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serialize( config.params );
  }

  var headers = copy(config.headers || {}, 'underscore');

  if( config.json && !config.body ) {
    headers.content_type = headers.content_type || 'application/json';
    config.body = JSON.stringify(config.json);
  } else if( headers.content_type === 'application/json' && typeof config.body === 'object' ) {
    config.body = JSON.stringify(config.body);
  } else if( typeof config.body === 'object' &&
      !isBlob(config.body) &&
      !isFormData(config.body) ) {
    config.body = JSON.stringify(config.body);
    if( !('content_type' in headers) ) headers.content_type = 'application/json';
  } else if( 'content_type' in headers && !headers.content_type ) delete headers.content_type;

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

  var request = null;
  var controller = new Parole(function (resolve, reject) {
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
          request = makeRequest(config,
            res_interceptors.length ? getInterceptorsProcessor(res_interceptors, resolve, reject) : resolve,
            res_error_interceptors.length ? getInterceptorsProcessor(res_error_interceptors, resolve, reject) : reject
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
      if( _options === undefined ) return _plainOptions( options_pile.concat(options) );
      merge( options, _options );
    },
    addInterceptor: function (interceptor_definitions) {
      options.interceptors = options.interceptors || [];
      options.interceptors.push(interceptor_definitions);
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

export default http;
