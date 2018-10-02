'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = serializeQS;

function keysTobrackets(keys) {
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
    params.push(keysTobrackets(keys) + '=' + encodeURIComponent('' + data));
    // params.push( keysTobrackets(keys) + '=' + '' + data );
  }

  return params;
}

function serializeQS(data) {
  // eslint-disable-next-line
  // console.log('serialize', data, _serialize(data, [], []) );
  return _serialize(data, [], []).join('&');
}
