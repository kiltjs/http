
import {extend, copy, toUnderscoreCase, parseContentType} from './utils';

function getFetchResponse (response, config) {
  var headers = {},
      iterator = response.headers.entries(),
      entry = iterator.next();

  while( entry && !entry.done ) {
    headers[toUnderscoreCase(entry.value[0])] = entry.value[1];
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
  fetch(config.url, extend( copy(config) , {
    headers: new Headers(config.headers), redirect: 'follow',
    credentials: config.credentials || (config.withCredentials ? 'include' : 'same-origin'),
  }) ).then(function (response) {
    getFetchResponse(response, config).then(response.ok ? resolve : reject);
  }, function (response) {
    getFetchResponse(response, config).then(reject);
  });
}

export default fetchRequest;
