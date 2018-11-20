/* globals describe, it */

import assert from 'assert'
import {copy, toCamelCase, toUnderscoreCase, toHeaderCase} from '../src/utils'

describe('copy', function() {

  [
    'foobar',
    { foo: 'bar' },
    { foo: 'bar', list: [1,2,3,4,5,6] },
    { foo: 'bar', list: [1,2,3,4,5,{
      foo: 'bar'
    }] },
  ].forEach(function (data) {

    it( JSON.stringify(data) , function () {
      assert.deepEqual( copy(data), data )
    })

  })

})

describe('copy:camelCase', function() {

  [
    [{ foo_bar: 'foobar' }, { fooBar: 'foobar' }],
    [{ foo_bar: 'foobar', 'hola-caracola': 'adios caracol' }, { fooBar: 'foobar', 'holaCaracola': 'adios caracol' }],
    [{ list: [1,2,3, { foo_bar: 'foobar' }] }, { list: [1,2,3, { fooBar: 'foobar' }] }],
    [ [1,2,3, { foo_bar: 'foobar' }], [1,2,3, { fooBar: 'foobar' }] ],
  ].forEach(function (data) {

    it( JSON.stringify(data[0]) + ' -> ' + JSON.stringify(data[1]) /*+ ' = ' + JSON.stringify( copy(data[0], toCamelCase) ) */, function () {
      assert.deepEqual( copy(data[0], toCamelCase), data[1] )
    })

    it( JSON.stringify(data[0]) + ' -> ' + JSON.stringify(data[1]) /*+ ' = ' + JSON.stringify( copy(data[0], 'camel') ) */, function () {
      assert.deepEqual( copy(data[0], 'camel'), data[1] )
    })

  })

})

describe('copy:underscore', function() {

  [
    [{ foo_bar: 'foobar' }, { foo_bar: 'foobar' }],
    [{ 'foo-bar-foobar': 'foobar' }, { foo_bar_foobar: 'foobar' }],
    [{ foo_bar: 'foobar', 'hola-caracola': 'adios caracol' }, { foo_bar: 'foobar', 'hola_caracola': 'adios caracol' }],
    [{ list: [1,2,3, { foo_bar: 'foobar' }] }, { list: [1,2,3, { foo_bar: 'foobar' }] }],
    [ [1,2,3, { foo_bar: 'foobar' }], [1,2,3, { foo_bar: 'foobar' }] ],
  ].forEach(function (data) {

    it( JSON.stringify(data[0]) + ' -> ' + JSON.stringify(data[1]) /*+ ' = ' + JSON.stringify( copy(data[0], toUnderscoreCase) ) */, function () {
      assert.deepEqual( copy(data[0], toUnderscoreCase), data[1] )
    })

    it( JSON.stringify(data[0]) + ' -> ' + JSON.stringify(data[1]) /*+ ' = ' + JSON.stringify( copy(data[0], 'underscore') ) */, function () {
      assert.deepEqual( copy(data[0], 'underscore'), data[1] )
    })

  })

})

describe('copy:header', function() {

  [
    [{ foo_bar: 'foobar' }, { 'Foo-Bar': 'foobar' }],
    [{ 'foo-bar-foobar': 'foobar' }, { 'Foo-Bar-Foobar': 'foobar' }],
    [{ foo_bar: 'foobar', 'hola-caracola': 'adios caracol' }, { 'Foo-Bar': 'foobar', 'Hola-Caracola': 'adios caracol' }],
    [{ list: [1,2,3, { foo_bar: 'foobar' }] }, { List: [1,2,3, { 'Foo-Bar': 'foobar' }] }],
    [ [1,2,3, { foo_bar: 'foobar' }], [1,2,3, { 'Foo-Bar': 'foobar' }] ],
  ].forEach(function (data) {

    it( JSON.stringify(data[0]) + ' -> ' + JSON.stringify(data[1]) /*+ ' = ' + JSON.stringify( copy(data[0], toHeaderCase) ) */, function () {
      assert.deepEqual( copy(data[0], toHeaderCase), data[1] )
    })

    it( JSON.stringify(data[0]) + ' -> ' + JSON.stringify(data[1]) /*+ ' = ' + JSON.stringify( copy(data[0], 'header') ) */, function () {
      assert.deepEqual( copy(data[0], 'header'), data[1] )
    })

  })

})
