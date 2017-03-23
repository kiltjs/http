/* global ActiveXObject */

import {headerToCamelCase, parseContentType} from './utils';

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

export default xmlRequest;
