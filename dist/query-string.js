'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.deserialize = deserialize;
exports.serialize = serialize;

function _qsKey(o, keys, value) {
  // eslint-disable-next-line
  // console.log('_qsKey', o, keys, value );

  var key = keys.shift();

  if (key === undefined) {
    return value;
  } else if (key === '') {
    if (!Array.isArray(o)) throw new Error('trying to assing empty key to non Array object');
    o.push(_qsKey(keys[0] === '' ? [] : {}, keys, value));
  } else {
    key = key.replace(/-/g, '_');
    o[key] = _qsKey(o[key] || (keys[0] === '' ? [] : {}), keys, value);
  }

  return o;
}

function deserialize(query_string) {
  var data = {};

  query_string.split('&').forEach(function (param) {
    if (!param) return;

    var parts = param.split(/=(.*)/),
        keys = parts[0].replace(/^\[|\]$/g, '').replace(/\]\[|\[|\]/g, '.').split('.');

    _qsKey(data, keys, decodeURIComponent(parts[1]));
  });

  return data;
}

function _keysTobrackets(keys) {
  return keys.reduce(function (result, key, i) {
    return result + (i ? '[' + key + ']' : key);
  }, '');
}

function _serialize(data, params, keys) {

  if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
    if (Array.isArray(data)) {
      for (var i = 0, n = data.length; i < n; i++) {
        _serialize(data[i], params, keys.concat(_typeof(data[i]) === 'object' ? i : ''));
      }
    } else {
      for (var k in data) {
        _serialize(data[k], params, keys.concat(k));
      }
    }
  } else {
    params.push(_keysTobrackets(keys) + '=' + encodeURIComponent('' + data));
    // params.push( keysTobrackets(keys) + '=' + '' + data );
  }

  return params;
}

function serialize(data) {
  // eslint-disable-next-line
  // console.log('serialize', data, _serialize(data, [], []) );
  return _serialize(data, [], []).join('&');
}
