/* global ActiveXObject */

import {toUnderscoreCase, parseContentType} from './utils'

var parseData = {
  json: function (data) {
    return JSON.parse(data)
  }
}

function _getXMLHeaders (request) {
  var headers = {}
  request.getAllResponseHeaders().split('\n').forEach(function (headerLine) {
    var matched = headerLine.match(/(.*?):(.*)/)
    if( matched ) {
      headers[toUnderscoreCase(matched[1])] = matched[2].trim()
    }
  })

  return headers
}

function xmlRequest (config, resolve, reject) {

  var xhr = null

  try { // Firefox, Opera 8.0+, Safari
    xhr = new XMLHttpRequest()
  } catch (e) { // Internet Explorer
    try { xhr = new ActiveXObject('Msxml2.XMLHTTP') }
    catch (er) { xhr = new ActiveXObject('Microsoft.XMLHTTP') }
  }
  if( xhr === null ) { throw 'Browser does not support HTTP Request' }

  if( config.with_credentials || config.withCredentials || config.credentials === 'include' ) xhr.withCredentials = true

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
          }

      if( xhr.status >= 200 && xhr.status < 400 ) {
        resolve( response )
      } else {
        reject( response )
      }
    }
  }

  try { // preventing IE errors
  if( 'timeout' in config ) xhr.timeout = config.timeout
  } catch(_e) {
    console.error('error setting timeout for ajax request', config) // eslint-disable-line
  }

  xhr.ontimeout = function () {
    reject('timeout')
  }

  xhr.open(config.method, config.url, true)

  if( config.headers ) {
    for( var key in config.headers ) {
      xhr.setRequestHeader( key, config.headers[key] )
    }
  }

  xhr.send( config.body || null )

  return {
    abort: function () {
      xhr.abort()
    },
  }
}

export default xmlRequest
