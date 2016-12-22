/* eslint-env node */
/*eslint no-console: 0*/

var URL = require('url');

var RE_contentType = /([^\/]+)\/([^+]+\+)?([^;]*)/;
function parseContentType(contentType) {
  var matches = contentType && contentType.match(RE_contentType);
  return matches ? matches[3] : 'text';
}

var parseData = {
  json: function (data) {
    return JSON.parse(data);
  }
};

module.exports = function (config, resolve, reject) {

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

  var req = require(url.protocol.replace(/:$/, '')).request(options, function (res) {
    // console.log(`STATUS: ${res.statusCode}`);
    // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    // res.setEncoding('utf8');
    res.setEncoding(config.headers['Content-Type'] ? 'utf8' : 'binary');

    res.on('data', function (chunk) {

      data = data ? data.concat(chunk) : chunk;
      // data.push(chunk);

    });

    res.on('end', function () {
      console.log('fetched', url.format() );
      resolve({ config: config, headers: res.headers, data: parseData[parseContentType(res.headers['Content-Type'])] || data });
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

};
