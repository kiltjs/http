
import {copy, extend, merge, isObject, isString, isFunction, headersToTitleSlug, serializeParams, resolveFunctions, joinPaths} from './utils';

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

export default http;
