/* globals describe, it */

// var assert = require('assert'),
//     deserialize = require('../src/deserialize');

import assert from 'assert';
import serialize from '../src/serialize';
import deserialize from '../src/deserialize';

var serialization_dataset = [
  {
    qs: 'foo=bar',
    data: { foo: 'bar' },
  },
  {
    qs: 'foo=bar&nested[value]=foobar',
    data: { foo: 'bar', nested: { value: 'foobar' } },
  },
  {
    qs: 'foo=bar&list[]=foo&list[]=bar',
    data: { foo: 'bar', list: ['foo', 'bar'] },
  },
  {
    qs: 'foo=bar&list[]=foo&list[]=bar&list[2]=hola',
    formal_qs: 'foo=bar&list[]=foo&list[]=bar&list[]=hola',
    data: { foo: 'bar', list: ['foo', 'bar', 'hola'] },
  },
  {
    qs: 'foo=bar&list[]=foo&list[]=bar&list[2]first_name=Johnny&list[2]last_name=Boy',
    formal_qs: 'foo=bar&list[]=foo&list[]=bar&list[2][first_name]=Johnny&list[2][last_name]=Boy',
    data: { foo: 'bar', list: ['foo', 'bar', { first_name: 'Johnny', last_name: 'Boy' }] },
  },
];

describe('serialize', () => {

  serialization_dataset.forEach(function (test) {
    it( JSON.stringify(test.data) + ' => ' + (test.formal_qs || test.qs) /*+ ' == ' + serialize(test.data) */, () => {
      assert.deepEqual( serialize(test.data), test.formal_qs || test.qs );
    });
  });

});

describe('deserialize', () => {

  serialization_dataset.forEach(function (test) {
    it( test.qs + ' => ' + JSON.stringify(test.data) /*+ ' == ' + JSON.stringify(deserialize(test.qs)) */, () => {
      assert.deepEqual( deserialize(test.qs), test.data );
    });
  });

});

describe('serialize -> deserialize', () => {

  serialization_dataset.forEach(function (test) {
    it( JSON.stringify(test.data), () => {
      assert.deepEqual( deserialize(serialize(test.data)), test.data );
    });
  });

});

describe('deserialize -> deserialize', () => {

  serialization_dataset.forEach(function (test) {
    it( test.qs, () => {
      assert.deepEqual( serialize(deserialize(test.qs)), test.formal_qs || test.qs );
    });
  });

});

describe('deserialize -> deserialize (formal_qs)', () => {

  serialization_dataset.forEach(function (test) {
    var qs = test.formal_qs || test.qs;
    it( qs, () => {
      assert.deepEqual( serialize(deserialize(qs)), qs );
    });
  });

});
