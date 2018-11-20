/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

global.btoa = function (text) {
  return Buffer.from(text).toString('base64')
}

// http.config({
//   headers: {
//     cookie: 'foo: bar'
//   }
// });

var headers_dataset = [
  [{}, {}],
  [{ content_type: 'application/json' }, { 'Content-Type': 'application/json' }],
  [{
    accept: function () {
      return 'Bearer a0987ys987sy9s87ys'
    },
    contentType: function () {
      return 'application/json'
    }
  }, { 'Accept': 'Bearer a0987ys987sy9s87ys', 'Content-Type': 'application/json' }]
]

describe('http:headers', function() {

  headers_dataset.forEach(function (headers) {

    it( '[' + Object.keys(headers[0]).join(', ') + '] -> ' + JSON.stringify(headers[1]) , function (done) {
      http.useRequest(function (config, resolve) {
        assert.deepEqual( config.headers, headers[1] )
        resolve()
        done()
      }).get('foo/bar?foo=bar', {
        headers: headers[0]
      }).catch(done)
    })

  })

})

describe('http:headers_base', function() {

  var headers_override = [
    [{ accept: 'Bearer a0987ys987sy9s87ys' }, { 'Accept': 'Bearer a0987ys987sy9s87ys' }],
    [{ content_type: 'application/xml' }, { 'Content-Type': 'application/xml' }],
    [{ content_type: 'application/xml' }, { 'Accept': 'Bearer a0987ys987sy9s87ys', 'Content-Type': 'application/xml' }],
  ]

  headers_override.forEach(function (headers, i) {

    it('(' + i + '): [' + Object.keys(headers[0]).join(', ') + '] -> ' + JSON.stringify(headers[1]) , function (done) {
      http.useRequest(function (config, resolve) {
        assert.deepEqual(config.headers, headers[1] )
        resolve()
        done()
      }).base(null, {
        headers: headers_dataset[i][0],
      }).get('foo/bar?foo=bar', {
        headers: headers[0],
      }).catch(done)
    })

  })

})

describe('http:headers Authorization', function() {

  it('foo:bar -> Basic Zm9vOmJhcg==' , function (done) {
    http.useRequest(function (config, resolve) {
      assert.deepEqual( config.headers.Authorization, 'Basic Zm9vOmJhcg==')
      resolve()
      done()
    }).get('foo/bar?foo=bar', {
      auth: { user: 'foo', pass: 'bar' },
    }).catch(done)
  })

})
