/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

function _noop () {}

http.addInterceptor({
  request: function (config) {
    config.foo = 'bar'
  },
})

describe('http:interceptors root', function() {
  it('foo === bar', function () {
    http.useRequest(function (config) {
      assert.strictEqual(config.foo, 'bar')
    }).get('foo-bar')
  })
})

describe('http:interceptors', function() {

  var _http = http.base()

  _http.addInterceptor({
    request: function (config) {
      config.foobar = true
    },
  })

  http.addInterceptor({
    request: function (config) {
      config.root_foobar = true
    },
  })

  it('base config.foobar' , function () {
    _http.useRequest(function (config) {
      assert.deepEqual(config.foobar, true)
      assert.deepEqual(config.root_foobar, true)
    }).get('foo/bar?foo=bar').catch(_noop)
  })

  it('base !config.foobar' , function () {
    http.useRequest(function (config) {
      assert.deepEqual(config.foobar, undefined)
      assert.deepEqual(config.root_foobar, true)
    }).get('foo/bar?foo=bar').catch(_noop)
  })

})

describe('http:interceptors', function() {

  var _http = http.base(),
      expected_response = 'expected response'

  _http.addInterceptor({
    response: function (res) {
      // console.log('addInterceptor.response');
      throw res
    },
  })

  it('base config.foobar' , function (done) {
    _http.useRequest(function (_config, resolve) {
      return resolve(expected_response)
    }).get('foo/bar?foo=bar').catch(function (res) {
      assert.deepEqual(res, expected_response)
      done()
    }).catch(done)
  })

})
