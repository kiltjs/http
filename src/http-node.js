/* eslint-env node */
/*eslint no-console: 0*/

var URL = require('url');
var http = require('./http-wrapper');

var protocols = {
  http: require('http'),
  https: require('https'),
};

var RE_contentType = /([^/]+)\/([^+]+\+)?([^;]*)/;
function parseContentType(contentType) {
  var matches = contentType && contentType.match(RE_contentType);
  return matches ? matches[3] : 'text';
}

var parseData = {
  json: function (data) {
    return JSON.parse(data);
  }
};

http.useRequest(function (config, resolve, reject) {

  var url = URL.parse(config.url);

  var options = {
    method: config.method,
    hostname: url.hostname,
    port: url.port,
    path: url.path,
    encoding: null,
    headers: config.headers
  };

  var data = null;
  // var data = [];

  var req = protocols[url.protocol.replace(/:$/, '')].request(options, function (res) {
    // console.log(`STATUS: ${res.statusCode}`);
    // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    // res.setEncoding('utf8');
    res.setEncoding(config.headers['Content-Type'] ? 'utf8' : 'binary');

    req.on('socket', function (socket) {
      if( 'timeout' in config )
      socket.setTimeout(config.timeout);
      socket.on('timeout', function () {
        // req.abort();
        reject('timeout');
      });
    });


    res.on('data', function (chunk) {

      data = data ? data.concat(chunk) : chunk;
      // data.push(chunk);

    });

    res.on('end', function () {
      console.log('fetched', url.format() );
      var format = parseContentType(res.headers['Content-Type']);
      resolve({ config: config, headers: res.headers, data: parseData[format] ? parseData[format](data) : data });
      // resolve({ config: options, data: Buffer.concat(data) });
    });

    res.on('error', function(err) {
      console.log('HTTP ERROR', err);
      reject({ ok: false, status: res.statusCode, statusText: res.statusMessage });
    });
  });

  req.on('error', function (e) {
    reject(e);
    // console.log(`problem with request: ${e.message}`);
  });

  req.end();

  return {
    abort: function () {
      req.abort();
    },
  };

});

module.exports = http;
