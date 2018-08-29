'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = deserializeQS;

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

function deserializeQS(query_string) {
	var data = {};

	query_string.split('&').forEach(function (param) {
		if (!param) return;
		var parts = param.split('='),
		    keys = parts[0].replace(/^\[|\]$/g, '').replace(/\]\[|\[|\]/g, '.').split('.');
		_qsKey(data, keys, decodeURIComponent(parts[1]));
	});

	return data;
}
