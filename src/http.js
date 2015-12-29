
// factory http

var $q = require('promise-q'),
    _ = require('nitro-tools/lib/kit-extend');

function resolveFunctions (o, thisArg, args) {
  for( var key in o ) {
    if( o[key] instanceof Function ) {
      o[key] = o[key].apply(thisArg, args || []);
    } else if( typeof o[key] === 'string' ) {
      o[key] = resolveFunctions(o[key], thisArg, args);
    }
  }
  return o;
}

function headerToTitleSlug(text) {
  console.log('headerToTitleSlug', text);
  var key = text.replace(/([a-z])([A-Z])/g, function (match, lower, upper) {
      return lower + '-' + upper;
  });
  key = key[0].toUpperCase() + key.substr(1);

  return key;
}

function headerToCamelCase(text) {
  var key = text[0].toLowerCase() + text.substr(1);
  return key.replace(/([a-z])-([A-Z])/g, function (match, lower, upper) {
    return lower + upper;
  });
}

var RE_contentType = /([^\/]+)\/([^+]+\+)?(.*)/;
function parseContentType(contentType, text, xml) {
  var matches = contentType && contentType.match(RE_contentType);
  return matches && ( matches[3] === 'json' ? JSON.parse(text) : ( matches[3] === 'xml' ? xml : text ) );
}

function _getHeaders (request) {
  var headers = {};
  request.getAllResponseHeaders().replace(/\s*([^\:]+)\s*\:\s*([^\;\n]+)/g, function (match, key, value) {
      headers[headerToCamelCase(key)] = value.trim();
  });

  return headers;
}

function http (url, config) {

  if( config === undefined ) {
    http.url(url);
  }

  config = resolveFunctions( _.copy(config || {}) );
  config.headers = config.headers || {};
  config.url = url;

  return $q(function (resolve, reject) {

    var request = null;

    try { // Firefox, Opera 8.0+, Safari
        request = new XMLHttpRequest();
    } catch (e) { // Internet Explorer
        try { request = new ActiveXObject('Msxml2.XMLHTTP'); }  // jshint ignore:line
        catch (er) { request = new ActiveXObject('Microsoft.XMLHTTP'); }  // jshint ignore:line
    }
    if( request === null ) { throw 'Browser does not support HTTP Request'; }

    if( config.params ) {
      var i = 0;
      for( var param in config.params ) {
        url += ( i++ ? '&' : ( /\?/.test(url) ? '&' : '?' ) ) + param + '=' + encodeURIComponent(config.params[param]);
      }
    }

    request.open( ( config.method || 'get').toUpperCase(), url );

    if( config.withCredentials ) {
      request.withCredentials = true;
    }

    for( var key in config.headers ) {
        request.setRequestHeader( headerToTitleSlug(key), config.headers[key] );
    }

    request.onreadystatechange = function(){
      if( request.readyState === 'complete' || request.readyState === 4 ) {
        var response = {
          config: request.config,
          data: parseContentType(request.getResponseHeader('content-type'), request.responseText, request.responseXML),
          status: request.status,
          headers: (function () {
            var headersCache;
            return function () {
              if( !headersCache ) {
                headersCache = _getHeaders(request);
              }
              return headersCache;
            };
          })(),
          xhr: request
        };
        if( request.status >= 200 && request.status < 300 ) {
          resolve( response );
        } else {
          reject( response );
        }
      }
    };

    request.config = config;

    if( typeof config.data !== 'string'  ) {}

    if( config.contentType ) {
      request.setRequestHeader( 'Content-Type', config.contentType );

      if( config.contentType === 'application/json' && typeof config.data !== 'string' ) {
        config.data = JSON.stringify(config.data);
      }

    } else {
      if( typeof config.data === 'string' ) {
        config.contentType = 'text/html';
      } else {
        config.contentType = 'application/json';
        config.data = JSON.stringify(config.data);
      }
    }

    request.send( config.data );

  });
}

http.noCache = function (url, config) {
  url += ( /\?/.test(url) ? '&' : '?' ) + 't=' + new Date().getTime();
  return http(url, config);
};

http.plainResponse = function (response) {
  return {
    config: response.config,
    data: response.data,
    status: response.status,
    headers: response.headers()
  };
};

['get', 'delete'].forEach(function (method) {
  http[method] = function (url, config) {
    config = _.copy(config || {});
    config.method = method;
    return http(config);
  };
});

['post', 'put'].forEach(function (method) {
  http[method] = function (url, data, config) {
    config = _.copy(config || {});
    config.data = data || {};
    config.method = method;
    return http(config);
  };
});

http.url = function (url) {
  var urlFn = function () {
    return http.get.apply(null, [url].concat( [].slice.call(arguments) ) );
  };
  ['get', 'post', 'put', 'delete'].forEach(function (method) {
    return http[method].apply(null, [url].concat( [].slice.call(arguments) ) );
  });
};

module.exports = http;
