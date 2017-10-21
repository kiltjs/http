
var isType = function (type, o) {
      return o ? typeof o === type : function (_o) {
        return typeof _o === type;
      };
    };

export function isObject (o) {
  return o !== null && typeof o === 'object';
}

export var isArray = Array.isArray || function (o) {
  return o instanceof Array;
};

export var isString = isType('string');
export var isFunction = isType('function');

export function mapObject (o, iteratee, thisArg) {
  var result = {};
  for( var key in o ) {
    result[key] = iteratee.call(thisArg, o[key], key);
  }
  return result;
}

export function copy (src) {
  if( isArray(src) ) {
    return src.map(function (item) {
      return copy(item);
    });
  }

  if( isObject(src) ) {
    return mapObject(src, function (item) {
      return copy(item);
    });
  }

  return src;
}

export function extend (dest, src) {
  dest = dest || {};
  for( var key in src ) dest[key] = src[key];
  return dest;
}

function _mergeArrays(dest, src, concatArrays) {
  if( !concatArrays ) return src.map(copy);
  [].push.apply(dest, src);
  for( var i = 0, n = src.length ; i < n ; i++ ) {
    dest.push( dest[i] ? merge(dest[i], src[i]) : copy(src[i]) );
  }
  return dest;
}

export function merge (dest, src, concatArrays) {
  if( typeof dest !== typeof src ) {
    if( isArray(src) ) dest = [];
    else if( typeof src === 'object' ) dest = {};
    else return src;
  }
  if( isArray(src) ) return _mergeArrays(dest, src, concatArrays);
  if( typeof src === 'object' ) {
    for( var key in src ) {
      dest[key] = merge(dest[key], src[key]);
    }
    return dest;
  }
  return src;
}

export function resolveFunctions (o, args, this_arg) {
  for( var key in o ) {
    if( isFunction(o[key]) ) {
      o[key] = o[key].apply(this_arg, args);
    } else if( isObject(o[key]) ) {
      o[key] = resolveFunctions(o[key], args, this_arg);
    }
  }
  return o;
}

export function headerToTitleSlug(text) {
  // console.log('headerToTitleSlug', text);
  var key = text.replace(/([a-z])([A-Z])/g, function (match, lower, upper) {
      return lower + '-' + upper;
  });
  key = key[0].toUpperCase() + key.substr(1);

  return key;
}

export function headersToTitleSlug(headers) {
  var _headers = {};

  for( var key in headers ) {
    _headers[ headerToTitleSlug(key) ] = headers[key];
  }

  return _headers;
}

export function headerToCamelCase(text) {
  var key = text[0].toLowerCase() + text.substr(1);
  return key.replace(/([a-z])-([a-zA-Z])/g, function (match, lower, upper) {
    return lower + upper.toUpperCase();
  });
}

export function headersToCamelCase(headers) {
  var _headers = {};

  for( var key in headers ) {
    _headers[ headerToCamelCase(key) ] = headers[key];
  }

  return _headers;
}

export function serializeParams (params) {
  var result = '';

  for( var param in params ) {
    result += ( result ? '&' : '' ) + param + '=' + encodeURIComponent(params[param]);
  }
  return result;
}

var RE_contentType = /([^/]+)\/([^+]+\+)?([^;]*)/;
export function parseContentType(contentType) {
  var matches = contentType && contentType.match(RE_contentType);
  return matches ? matches[3] : 'text';
}


var arrayPush = Array.prototype.push,
    arraySlice = Array.prototype.slice;

function _sanitizePath(path, i, last) {
  if( i > 0 ) path = path.replace(/^\.*\//, '');
  if( !last ) path = path.replace(/\/$/, '');
  return path.split(/\/+/);
}

function _joinPaths (paths) {
  var last = paths.length - 1;
  return paths.reduce(function (result, path, i) {

    if( path === '.' ) return result;
    if( /^\//.test(path) ) return _sanitizePath(path, 0, i === last );

    path = path.replace(/\.\.\//g, function () {
      result = result.slice(0, -1);
      return '';
    }).replace(/\.\//, '');

    arrayPush.apply( result, _sanitizePath(path, i, i === last) );

    return result;

  }, []).join('/');
}

function _unraise (paths) {
  var result = [];

  paths.forEach(function (path) {
    if( !path ) return;

    // https://jsperf.com/array-prototype-push-apply-vs-concat/17
    if( path instanceof Array ) arrayPush.apply(result, _unraise(path) );
    else if( typeof path === 'string' ) result.push(path);
    else throw new Error('paths parts should be Array or String');
  });

  return result;
}

export function joinPaths () {
  return _joinPaths( _unraise(arraySlice.call(arguments)) );
}
