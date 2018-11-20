/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

describe('http:url', function() {

  [
    ['foo', { foo: 'data' }],
  ].forEach(function (requests) {

    it('http(url): ' + requests[0] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve({ config: config, data: config.data })
        })(requests[0], { data: requests[1] })
        .then(function (res) {
          assert.deepEqual(res.data, requests[1] )
          assert.strictEqual(res.config.body, JSON.stringify(requests[1]) )
          assert.strictEqual(res.config.url, requests[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http.post(url, data): ' + requests[0] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve({ config: config, data: config.data })
        }).post(requests[0], requests[1])
        .then(function (res) {
          assert.deepEqual(res.data, requests[1] )
          assert.strictEqual(res.config.body, JSON.stringify(requests[1]) )
          assert.strictEqual(res.config.url, requests[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

    it('http.base(url).post(data): ' + requests[0] , function (done) {
      http
        .useRequest(function (config, resolve) {
          resolve({ config: config, data: config.data })
        }).base(requests[0]).post(requests[1])
        .then(function (res) {
          assert.deepEqual(res.data, requests[1] )
          assert.strictEqual(res.config.body, JSON.stringify(requests[1]) )
          assert.strictEqual(res.config.url, requests[0] )
          done()
        }, function (err) {
          console.log('Unexpected error', err) // eslint-disable-line
        }).catch(done)
    })

  })

})
