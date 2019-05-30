/* globals describe, it */

import assert from 'assert'
import http from '../src/http-rest'

describe('http.config', function () {

    it('http://example.com', function () {

        var _http = http.base('http://example.com')

        assert.deepEqual(
            _http.config(),
            {
                url: 'http://example.com'
            }
        )

    })

    it('http://example.com?foo=bar', function () {

        var _http = http.base('http://example.com?foo=bar')

        assert.deepEqual(
            _http.config(),
            {
                url: 'http://example.com',
                params: {
                    foo: 'bar',
                },
            }
        )

    })

    it('http://example.com?foo=bar, { bar: \'foo\' }', function () {

        var _http = http.base('http://example.com?foo=bar', { params: { bar: 'foo' } })

        assert.deepEqual(
            _http.config(),
            {
                url: 'http://example.com',
                params: {
                    foo: 'bar',
                    bar: 'foo',
                },
            }
        )

    })

})