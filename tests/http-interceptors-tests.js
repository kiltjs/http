/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

function _noop () {}

http.addInterceptor({
  config: function (config) {
    config.foo = 'bar'
  },
})

describe('http:interceptors root', function() {
  it('foo === bar', function (done) {
    http.useRequest(function (config) {
      assert.strictEqual(config.foo, 'bar')
      done()
    }).get('foo-bar')
  })
})

describe('http:interceptors', function() {

  var _http = http.base()

  _http.addInterceptor({
    config: function (config) {
      config.foobar = true
    },
  })

  http.addInterceptor({
    config: function (config) {
      config.root_foobar = true
    },
  })

  it('base config.foobar' , function (done) {
    _http.useRequest(function (config) {
      assert.deepEqual(config.foobar, true)
      assert.deepEqual(config.root_foobar, true)
      done()
    }).get('foo/bar?foo=bar')
  })

  it('base !config.foobar' , function (done) {
    http.useRequest(function (config) {
      assert.deepEqual(config.foobar, undefined)
      assert.deepEqual(config.root_foobar, true)
      done()
    }).get('foo/bar?foo=bar')
  })

})

describe('http:interceptors response: resolve', function() {

  var _http = http.base()

  _http.addInterceptor({
    response: function (_res) {
      // console.log('addInterceptor.response');
      return 'response replaced'
    },
  })

  it('base config.foobar' , function (done) {
    _http.useRequest(function (_config, resolve) {
      resolve('original response')
    }).get('foo/bar?foo=bar').then(function (res) {
      assert.deepEqual(res, 'response replaced')
      done()
    })
  })

})

describe('http:interceptors response: reject', function() {

  var _http = http.base()

  _http.addInterceptor({
    response: function () {
      // console.log('addInterceptor.response');
      throw 'response replaced'
    },
  })

  it('base config.foobar' , function (done) {
    _http.useRequest(function (_config, resolve) {
      resolve('original response')
    }).get('foo/bar?foo=bar').catch(function (res) {
      assert.deepEqual(res, 'response replaced')
      done()
    })
  })

})

describe('http:interceptors responseError: resolve', function() {

  var _http = http.base()

  _http.addInterceptor({
    responseError: function (_res) {
      // console.log('addInterceptor.response');
      return 'response replaced'
    },
  })

  it('base config.foobar' , function (done) {
    _http.useRequest(function (_config, _resolve, reject) {
      reject('original response')
    }).get('foo/bar?foo=bar').then(function (res) {
      assert.deepEqual(res, 'response replaced')
      done()
    })
  })

})

describe('http:interceptors responseError: reject', function() {

  var _http = http.base()

  _http.addInterceptor({
    responseError: function () {
      // console.log('addInterceptor.response');
      throw 'response replaced'
    },
  })

  it('base config.foobar' , function (done) {
    _http.useRequest(function (_config, _resolve, reject) {
      reject('original response')
    }).get('foo/bar?foo=bar').catch(function (res) {
      assert.deepEqual(res, 'response replaced')
      done()
    })
  })

})