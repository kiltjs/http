
var _isType = function (type, o) {
      return o ? typeof o === type : function (_o) {
        return typeof _o === type
      }
    }

export function isObject (o) {
  return o && typeof o === 'object'
}

export var isArray = Array.isArray || function (o) {
  return o instanceof Array
}

export function isPlainObject (o) {
  return o && !isArray(o) && typeof o === 'object'
}

export var isString = _isType('string')
export var isFunction = _isType('function')

export function isThenable (o) {
  return (isObject(o) || isFunction(o)) && isFunction(o.then)
}

export function toUnderscoreCase (text) {
  return text.replace(/-/g, '_').replace(/([a-z])([A-Z])/, function (matched, a, b) { return a + '_' + b }).toLowerCase()
}

export function toCamelCase (text) {
  return text.replace(/([a-z])[-_]([a-z])/g, function (matched, a, b) { return a + b.toUpperCase() })
}

export function toHeaderCase (text) {
  var key = text.replace(/_/g, '-').replace(/([a-z])([A-Z])/, function (matched, a, b) { return a + '-' + b })
  return key[0].toUpperCase() + key.substr(1).toLowerCase().replace(/-[a-z]/g, function (matched) { return matched.toUpperCase() })
}

function _passThrought (value) {
  return value
}

var case_formatters = {
  underscore: toUnderscoreCase,
  camel: toCamelCase,
  header: toHeaderCase,
}

export function mapObject (o, iteratee, thisArg, mapFormatter) {
  var result = {}
  mapFormatter = mapFormatter || _passThrought
  for( var key in o ) {
    result[mapFormatter(key)] = iteratee.call(thisArg, o[key], key)
  }
  return result
}

export function copy (src, mapFormatter) {
  if( typeof mapFormatter === 'string' ) mapFormatter = case_formatters[mapFormatter]

  if( isArray(src) ) {
    return src.map(function (item) {
      return copy(item, mapFormatter)
    })
  }

  if( isObject(src) ) {
    return mapObject(src, function (item) {
      return copy(item, mapFormatter)
    }, src, mapFormatter)
  }

  return src
}

export function extend (dest, src) {
  dest = dest || {}
  for( var key in src ) dest[key] = src[key]
  return dest
}

function _mergeArrays(dest, src, concat_arrays) {
  if( !concat_arrays ) {
    return src.map(function (item) { return copy(item) })
  }
  [].push.apply(dest, src.map(function (item) { return copy(item) }) )
  // for( var i = 0, n = src.length ; i < n ; i++ ) {
  //   dest.push( dest[i] ? merge(dest[i], src[i], concat_arrays) : copy(src[i]) );
  // }
  return dest
}

export function merge (dest, src, concat_arrays) {
  if( typeof dest !== typeof src ) {
    if( isArray(src) ) dest = []
    else if( typeof src === 'object' ) dest = {}
    else return src
  }
  if( isArray(src) ) return _mergeArrays(dest, src, concat_arrays)
  if( typeof src === 'object' ) {
    for( var key in src ) {
      dest[key] = merge(dest[key], src[key], concat_arrays)
    }
    return dest
  }
  return src
}

export function resolveFunctions (o, args, this_arg) {
  for( var key in o ) {
    if( isFunction(o[key]) ) {
      o[key] = o[key].apply(this_arg, args)
    } else if( isObject(o[key]) ) {
      o[key] = resolveFunctions(o[key], args, this_arg)
    }
  }
  return o
}

var RE_contentType = /([^/]+)\/([^+]+\+)?([^;]*)/

export function parseContentType(contentType) {
  var matches = contentType && contentType.match(RE_contentType)
  return matches ? matches[3] : 'text'
}


var arrayPush = Array.prototype.push,
    arraySlice = Array.prototype.slice

function _sanitizePath(path, i, last) {
  if( i > 0 ) path = path.replace(/^\.*\//, '')
  if( !last ) path = path.replace(/\/$/, '')
  return path.split(/\/+/)
}

function _joinPaths (paths) {
  var last = paths.length - 1
  return paths.reduce(function (result, path, i) {
    if( path === '.' ) return result
    if( /^[a-z]+:\/\//.test(path) ) return [i === last ? path : path.replace(/\/$/, '')]
    if( /^\//.test(path) ) return _sanitizePath(path, 0, i === last )

    path = path.replace(/\.\.\//g, function () {
      result = result.slice(0, -1)
      return ''
    }).replace(/\.\//, '')

    arrayPush.apply( result, _sanitizePath(path, i, i === last) )

    return result

  }, []).join('/')
}

function _unraise (paths) {
  var result = []

  paths.forEach(function (path) {
    if( !path ) return

    // https://jsperf.com/array-prototype-push-apply-vs-concat/17
    if( path instanceof Array ) arrayPush.apply(result, _unraise(path) )
    else if( typeof path === 'string' ) result.push(path)
    else throw new Error('paths parts should be Array or String')
  })

  return result
}

export function joinPaths () {
  return _joinPaths( _unraise(arraySlice.call(arguments)) )
}

export function plainOptions (_options_pile, _method) {
  var options_pile = _options_pile ? copy(_options_pile) : []

  var plain_options = {},
      options = options_pile.shift()

  while( options ) {
    merge(plain_options, options, true)
    options = options_pile.shift()
  }

  // if(method) plain_options.method = method;

  // plain_options.url = joinPaths( _options_pile.reduce(function (paths, options) {
  //   if( !options.url ) return paths;
  //
  //   if( options.url instanceof Function ) return paths.concat( options.url(plain_options) );
  //
  //   return paths.concat(options.url);
  // }, []) );

  return plain_options
}

export function defer () {
  var completed = false,
      fulfilled, value,
      resolve_listeners = [],
      reject_listeners = []

  return {
    resolve: function (result) {
      value = result
      completed = true
      fulfilled = true

      resolve_listeners.forEach(function (listener) {
        listener(value)
      })

      resolve_listeners = null
    },
    reject: function (reason) {
      value = reason
      completed = true
      fulfilled = false

      reject_listeners.forEach(function (listener) {
        listener(value)
      })

      reject_listeners = null
    },
    promise: {
      then: function (onResolve, onReject) {
        if( completed ) {
          if( fulfilled ) {
            if( onResolve instanceof Function ) onResolve(value)
          } else {
            if( onReject instanceof Function ) onReject(value)
          }
          return this
        }
        if( onResolve instanceof Function ) resolve_listeners.push(onResolve)
        if( onReject instanceof Function ) reject_listeners.push(onReject)
        return this
      },
      catch: function (onReject) {
        return this.then(null, onReject)
      },
    },
  }
}
