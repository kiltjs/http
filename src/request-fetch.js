
import {extend, copy, toUnderscoreCase, parseContentType} from './utils'

function getFetchResponse (response, config) {
  var headers = {},
      iterator = response.headers.entries(),
      entry = iterator.next()

  while( entry && !entry.done ) {
    headers[toUnderscoreCase(entry.value[0])] = entry.value[1]
    entry = iterator.next()
  }

  var type = parseContentType(headers.content_type)

  return ( response[config.format || type] ? response[config.format || type]() : response.text() ).then(function (data) {
    return {
      config: config,
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: headers,
    }
  })
}

function fetchRequest (config, resolve, reject) {
  var controller = new AbortController

  if( config.timeout ) {
    setTimeout(function () {
      reject('timeout')
    }, config.timeout)
  }

  var _config = extend( copy(config) , {
    headers: new Headers(config.headers),
    redirect: 'follow',
  })

  if( config.withCredentials ) {
    _config.mode = 'cors'
    _config.credentials = 'include'
  }

  fetch(config.url, { signal: controller.signal }, _config ).then(function (response) {
    getFetchResponse(response, config).then(response.ok ? resolve : reject)
  }, function (response) {
    getFetchResponse(response, config).then(reject)
  })

  return {
    abort: function () {
      controller.abort()
    },
  }
}

export default fetchRequest
