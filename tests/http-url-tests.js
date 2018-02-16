/* globals describe, it */

import assert from 'assert';
import http from '../src/wrapper';

function _noop () {}

var urls_dataset = [
  ['foo', 'foo'],
  ['resource/:resourceId', 'resource/:resourceId'],
];

describe('http:url', function() {

  urls_dataset.forEach(function (urls) {

    it( urls[0] + ' -> ' + urls[1] , function () {
      http
        .useRequest(function (config) {
          assert.strictEqual( config.url, urls[1] );
        })
        .get(urls[0])
        .catch(_noop);
    });

  });

});

describe('http:url_base', function() {

  var headers_override = [
    ['bar', 'foo/bar'],
    ['nested/:nestedId', 'resource/:resourceId/nested/:nestedId'],
  ];

  headers_override.forEach(function (urls, i) {

    it( urls[0] + ' + ' + urls_dataset[i] + ' -> ' + urls[1] , function () {
      http
        .useRequest(function (config) {
          assert.strictEqual( config.url, urls[1] );
        })
        .base(urls_dataset[i])
        .get(urls[0])
        .catch(_noop);
    });

  });

});
