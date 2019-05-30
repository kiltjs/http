
import {copy, extend, merge, isArray, isPlainObject, isString, isFunction, isThenable, resolveFunctions, plainOptions, plainUrl} from './utils'
import {serialize, deserialize} from './query-string'

var http_defaults = {},
    _makeRequest = function () {}

var Parole = typeof Promise !== 'undefined' ? Promise : function () {}

function _getInterceptorsProcessor (interceptors, resolve_fn, reject_fn, resolve, reject, is_error) {
  
  function _processInterceptor (_res, interceptor) {
    if( !interceptor ) return (is_error ? reject : resolve)(_res)

    var result = undefined,
        _runInterceptor = interceptor[is_error ? reject_fn : resolve_fn]

    if( !_runInterceptor ) return _processInterceptor(_res, interceptors.shift())

    try{
      result = _runInterceptor(_res)
      if( result === undefined ) result = _res
      is_error = false
    } catch (err) {
      result = err
      is_error = true
    }

    _processInterceptor(result, interceptors.shift())
  }

  return function (res) {
    _processInterceptor( res, interceptors.shift() )
  }
}

function _plainConfig (options_pile) {
  var config = plainOptions(options_pile)
  if( config.url instanceof Array ) config.url = plainUrl(config.url, config)
  return config
}

function _fullUrl (url, params) {
  if( !params || !Object.keys(params).length ) return url
  return url + ( /\?/.test(url) ? '&' : '?' ) + serialize(params)
}

var isBlob = typeof Blob === 'function' ? function (x) {
  return Blob.prototype.isPrototypeOf(x)
} : function () { return false }

var isFormData = typeof FormData === 'function' ? function (x) {
  return FormData.prototype.isPrototypeOf(x)
} : function () { return false }

function http (url, _config, data) {
  if( isPlainObject(url) ) {
    data = _config
    _config = url
    url = null
  }

  var config = _plainConfig([http_defaults, _config || {}, url ? { url: isArray(url) ? url : [url] } : {}])

  config.method = config.method ? config.method.toUpperCase() : 'GET'
  config.timestamp = new Date().getTime()

  if( !isString(config.url) ) throw new Error('url must be a string')

  var _interceptors = config.interceptors || []
  delete config.interceptors

  var _data = data || config.data
  var _json = config.json

  data = _data || _json

  var is_json = data && ( 'json' in config || (
    typeof data === 'object' && !isBlob(data) && !isFormData(data)
  ) )

  // should not be resolved
  delete config.data
  delete config.json

  config = resolveFunctions(config, [config])

  if( _data !== undefined ) config.data = _data
  if( _json !== undefined ) config.json = _json

  config.is_json = is_json
  config.body = is_json && typeof data !== 'string' ? JSON.stringify(data) : data

  if( config.params ) {
    config.url += ( /\?/.test(config.url) ? '&' : '?' ) + serialize( config.params )
  }

  var headers = copy(config.headers || {}, 'underscore')

  if( config.auth ) {
    if( !isString(config.auth.user) ) throw new TypeError('auth.user should be a String')
    if( !isString(config.auth.pass) ) throw new TypeError('auth.pass should be a String')

    headers.authorization = 'Basic ' + btoa(config.auth.user + ':' + config.auth.pass)
  }

  if( is_json && !headers.content_type ) headers.content_type = 'application/json'
  if( 'content_type' in headers && !headers.content_type ) delete headers.content_type

  // headers.accept = headers.accept || headers.content_type || 'application/json'

  config.headers = copy(headers, 'header')

  var request = null

  var req_config = _interceptors.reduce(function (_config, _interceptor) {
    if( !_interceptor.config ) return _config
    var result = _interceptor.config(_config)
    return result === undefined ? _config : result
  }, config)

  var req = _interceptors.reduce(function (req, _interceptor) {
    if( req ) return req
    if( !_interceptor.request ) return
    return _interceptor.request(req_config)
  }, undefined)

  if( req && !isThenable(req) ) req = Parole.resolve(req)

  req = req || new Parole(function (resolve, reject) {
    request = _makeRequest(req_config,
      _getInterceptorsProcessor(_interceptors, 'response', 'responseError', resolve, reject, false),
      _getInterceptorsProcessor(_interceptors, 'response', 'responseError', resolve, reject, true)
    )
  })

  req.abort = function () {
    if( request ) request.abort()
  }

  return req
}

http.responseData = function (response) {
  return response.data
}

var _concat = Array.prototype.concat

function _httpBase (target, options, options_pile) {
  var _requestMethod = function (method, has_data) {
    return has_data ? function (url, data, _options) {

      if( isPlainObject(url) ) {
        _options = data
        data = url
        url = null
      }

      return http( plainOptions(
        _concat.call(options_pile, _options || {}, url ? {
          method: method,
          data: data,
          url: isArray(url) ? url : [url]
        } : { method: method, data: data })
      ), data )

    } : function (url, _options) {

      if( isPlainObject(url) ) {
        _options = url
        url = null
      }

      return http( plainOptions(
        _concat.call(options_pile, _options || {}, url ? {
          method: method,
          url: isArray(url) ? url : [url]
        } : { method: method })
      ) )

    }
  }

  return extend(target, {
    head: _requestMethod('head'),
    get: _requestMethod('get'),
    post: _requestMethod('post', true),
    put: _requestMethod('put', true),
    patch: _requestMethod('patch', true),
    delete: _requestMethod('delete'),
    options: _requestMethod('options'), // for node
    base: function (url, options) {
      var _options = options ? copy(options) : {}

      if( typeof url === 'string' && url.indexOf('?') >= 0 ) {
        url = url.split(/\?(.*)/)
        _options.url = [url[0]]
        _options.params = merge( deserialize(url[1]), _options.params || {})
      } else if( url ) {
        _options.url = isArray(url) ? url : [url]
      }
      return _httpBase( _requestMethod('get'), _options, options_pile.concat(_options) )
    },
    config: function (_options) {
      if( _options === undefined ) return _plainConfig( options_pile )
      merge( options, _options )
    },
    getUrl: function (url, params) {
      if( typeof url === 'object' ) {
        params = url
        url = null
      }

      var _config = _plainConfig( options_pile.concat( url ? { url: [url], params: params } : { params: params } ) )

      return _fullUrl(
        _config.url,
        _config.params
      )
    },
    addInterceptor: function (interceptor_definitions) {
      options.interceptors = options.interceptors || []
      options.interceptors.push(interceptor_definitions)
    },
    responseData: http.responseData,
    useRequest: function (__makeRequest) {
      if( !isFunction(__makeRequest) ) throw new Error('_makeRequest should be a function')
      _makeRequest = __makeRequest
      return target
    },
  })
}

http.base = _httpBase
_httpBase(http, http_defaults, [])

http.usePromise = function (P) { Parole = P; return http }
http.useRequest = function (__makeRequest) {
  if( !isFunction(__makeRequest) ) throw new Error('_makeRequest should be a function')
  _makeRequest = __makeRequest
  return http
}

http.config = function (options) {
  if( options === undefined ) return copy(http_defaults)
  merge( http_defaults, options )
  return http
}

http.fullUrl = _fullUrl

export default http
