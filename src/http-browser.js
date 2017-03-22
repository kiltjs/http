/* global ActiveXObject */

import http from './wrapper';

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

http.useRequest( (window.fetch ? function () {

  function getFetchResponse (response, config) {
    var headers = {},
        iterator = response.headers.entries(),
        entry = iterator.next();

    while( entry && !entry.done ) {
      headers[headerToCamelCase(entry.value[0])] = entry.value[1];
      entry = iterator.next();
    }

    var type = parseContentType(headers.contentType);

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
    var options = { headers: new Headers(config.headers), redirect: 'follow', credentials: 'same-origin' };
    if( config.withCredentials ) options.credentials = 'include';
    if( config.credentials ) options.credentials = config.credentials;

    fetch(config.url, options).then(function (response) {
      getFetchResponse(response, config).then(resolve);
    }, function (response) {
      getFetchResponse(response, config).then(reject);
    });
  }

  return fetchRequest;

} : function () {

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
        headers[headerToCamelCase(matched[1])] = matched[2].trim();
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
        request.setRequestHeader( key, config.headers[key] );
      }
    }

    request.send( config.body );
  }

  return xmlRequest;

})() );

export default http;
