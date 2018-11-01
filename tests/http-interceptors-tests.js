/* globals describe, it */

import assert from 'assert';
import http from '../src/http-wrapper';

function _noop () {}

http.addInterceptor({
  request: function (config) {
    config.foo = 'bar';
  },
});

describe('http:interceptors root', function() {
  it('foo === bar', function () {
    http.useRequest(function (config) {
      assert.strictEqual(config.foo, 'bar');
    }).get('foo-bar');
  });
});

describe('http:interceptors', function() {

  var _http = http.base();

  _http.addInterceptor({
    request: function (config) {
      config.foobar = true;
    },
  });

  http.addInterceptor({
    request: function (config) {
      config.root_foobar = true;
    },
  });

  it('base config.foobar' , function () {
    _http.useRequest(function (config) {
      assert.deepEqual(config.foobar, true);
      assert.deepEqual(config.root_foobar, true);
    }).get('foo/bar?foo=bar').catch(_noop);
  });

});
