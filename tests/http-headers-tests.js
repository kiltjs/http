/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

global.btoa = function (text) {
  return Buffer.from(text).toString('base64')
}

function _noop () {}

// http.config({
//   headers: {
//     cookie: 'foo: bar'
//   }
// });

var headers_dataset = [
  [{}, { 'Content-Type': 'application/json' }],
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

    it( '[' + Object.keys(headers[0]).join(', ') + '] -> ' + JSON.stringify(headers[1]) , function () {
      http.useRequest(function (config) {
        assert.deepEqual( config, headers[1] )
      }).get('foo/bar?foo=bar', {
        headers: headers[0]
      })
    })

  })

})

describe('http:headers_base', function() {

  var headers_override = [
    [{ accept: 'Bearer a0987ys987sy9s87ys' }, { 'Accept': 'Bearer a0987ys987sy9s87ys', 'Content-Type': 'application/json' }],
    [{ content_type: 'application/xml' }, { 'Accept': 'Bearer a0987ys987sy9s87ys', 'Content-Type': 'application/xml' }],
    [{ content_type: 'application/xml' }, { 'Accept': 'Bearer a0987ys987sy9s87ys', 'Content-Type': 'application/xml' }],
  ]

  headers_override.forEach(function (headers, i) {

    it( '[' + Object.keys(headers[0]).join(', ') + '] -> ' + JSON.stringify(headers[1]) , function () {
      http.useRequest(function (config) {
        assert.deepEqual( config, headers[1] )
      }).base(null, {
        headers: headers_dataset[i]
      }).get('foo/bar?foo=bar', {
        headers: headers[0]
      }).catch(_noop)
    })

  })

})

describe('http:headers Authorization', function() {

  it('foo:bar -> Basic Zm9vOmJhcg==' , function () {
    http.useRequest(function (config) {
      assert.deepEqual( config.headers.authorization, 'Basic Zm9vOmJhcg==')
    }).get('foo/bar?foo=bar', {
      auth: { user: 'foo', pass: 'bar' },
    }).catch(_noop)
  })

})
