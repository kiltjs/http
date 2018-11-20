/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

var params_set = [
  [{ foo: 'bar' }, 'foo=bar'],
  [{ foo: 'bar', nested: { data: 'foobar' } }, 'foo=bar&nested[data]=foobar'],
]

var non_data_methods = ['head', 'get', 'delete']
var data_methods = ['post', 'put', 'patch']

describe('http:params', function() {

  params_set.forEach(function (param) {
    var params = param[0],
        qs = param[1]

    non_data_methods.forEach(function (method) {

      it(method.toUpperCase() + ' ' + qs, function (done) {

        http
          .useRequest(function (config, resolve) {
            resolve(config)
          })[method]('this is a test', { params: params })
          .then(function (config) {
            assert.strictEqual( config.url, 'this is a test?' + qs )
            done()
          }, done)

      })

    })

    data_methods.forEach(function (method) {

      it(method.toUpperCase() + ' ' + qs, function (done) {

        http
          .useRequest(function (config, resolve) {
            resolve(config)
          })[method]('this is a test', {}, { params: params })
          .then(function (config) {
            assert.strictEqual( config.url, 'this is a test?' + qs )
            done()
          }, done)

      })

    })

  })

})

describe('http:params (url)', function() {

  [
    ['foo', { foo: 'bar' }, 'foo?foo=bar'],
    ['resource/:resourceId', { foobar: 'test' }, 'resource/:resourceId?foobar=test'],
  ].forEach(function (urls) {

    it('http(url): ' + urls[0] + ' -> ' + urls[2] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })(urls[0], { params: urls[1] })
        .then(function (config) {
          assert.strictEqual( config.url, urls[2] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http(options): ' + urls[0] + ' -> ' + urls[2] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })({
          url: urls[0],
          params: urls[1],
        })
        .then(function (config) {
          assert.strictEqual( config.url, urls[2] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http(null, options): ' + urls[0] + ' -> ' + urls[2] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })(null, {
          url: urls[0],
          params: urls[1],
        })
        .then(function (config) {
          assert.strictEqual( config.url, urls[2] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http.get(url): ' +  urls[0] + ' -> ' + urls[2] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve(config)
        })
        .get(urls[0], { params: urls[1] })
        .then(function (config) {
          assert.strictEqual( config.url, urls[2] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

  })

})
