/* globals describe, it */

import assert from 'assert';
import {plainOptions} from '../src/utils';

describe('plainOptions', function () {

  it('plain objects with strings', function () {

    assert.deepEqual( plainOptions([{ foo: 'bar' }, { bar: 'foo' }]), { foo: 'bar', bar: 'foo' });

  });

});
