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

})