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
