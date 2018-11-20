/* globals describe, it */

import assert from 'assert'
import {merge, plainOptions} from '../src/utils'

describe('merge', function () {

  it('plain objects with strings', function () {

    assert.deepEqual( merge({ foo: 'bar' }, { bar: 'foo' }), { foo: 'bar', bar: 'foo' })

  })

  it('plain objects replacing Arrays', function () {

    assert.deepEqual( merge({ foo: ['foo'] }, { bar: 'bar', foo: ['bar'] }), { foo: ['bar'], bar: 'bar' })

  })

  it('plain objects joining Arrays', function () {

    assert.deepEqual( merge({ foo: ['foo'] }, { bar: 'bar', foo: ['bar'] }, true), { foo: ['foo', 'bar'], bar: 'bar' })

  })

})

describe('plainOptions', function () {

  it('plain objects with strings', function () {

    assert.deepEqual( plainOptions([{ foo: 'bar' }, { bar: 'foo' }]), { foo: 'bar', bar: 'foo' })

  })

  it('plain objects with Arrays', function () {

    assert.deepEqual( plainOptions([{ foo: ['foo'] }, { bar: 'bar', foo: ['bar'] }]), { foo: ['foo', 'bar'], bar: 'bar' })

  })

})
