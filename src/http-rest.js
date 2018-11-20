
import {copy, extend, merge, isArray, isPlainObject, isString, isFunction, resolveFunctions, plainOptions, joinPaths} from './utils'
import {serialize} from './query-string'

var http_defaults = {},
    _makeRequest = function () {}

var Parole = typeof Promise !== 'undefined' ? Promise : function () {}

function _getInterceptorsProcessor (interceptors, resolve, reject, is_error) {
  var running_error = is_error === true

  function _processInterceptor (_res, interceptor) {
    if( !interceptor ) return (running_error ? reject : resolve)(_res)

    var result = undefined

    try{
      result = interceptor(_res)
      if( result === undefined ) result = _res
      else running_error = false
    } catch (err) {
      result = err
      running_error = true
    }

    if( running_error !== is_error ) (running_error ? reject : resolve)(_res)
    else _processInterceptor(result, interceptors.shift())
  }

  return function (res) {
    _processInterceptor( res, interceptors.shift() )
  }
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

  var config = plainOptions([http_defaults, _config || {}, url ? { url: isArray(url) ? url : [url] } : {}])

  if( config.url instanceof Array ) config.url = joinPaths( config.url.map(function (_path_part) {
    if( isFunction(_path_part) ) _path_part = _path_part(config)
    if( !isString(_path_part) ) throw new TypeError('url_part should be a String')
    return _path_part
  }) )

  config.method = config.method ? config.method.toUpperCase() : 'GET'
  config.timestamp = new Date().getTime()

  if( !isString(config.url) ) throw new Error('url must be a string')

  data = data || config.data || config.json

  var is_json = data && 'json' in config || (
    typeof data === 'object' && !isBlob(data) && !isFormData(data)
  )

  config.data = data

  var interceptors = config.interceptors || []
  delete config.interceptors

  config = resolveFunctions(config, [config])

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

  headers.accept = headers.accept || headers.content_type || 'application/json'

  config.headers = copy(headers, 'header')

  var req_interceptors = [],
      // req_error_interceptors = [],
      res_interceptors = [],
      res_error_interceptors = []

  interceptors.forEach(function (interceptor) {
    if( interceptor.request ) req_interceptors.push(interceptor.request)
    // if( interceptor.requestError ) req_error_interceptors.push(interceptor.requestError);
    if( interceptor.response ) res_interceptors.push(interceptor.response)
    if( interceptor.responseError ) res_error_interceptors.push(interceptor.responseError)
  })

  var request = null

  var controller = new Parole(function (resolve, reject) {
        if( req_interceptors.length ) _getInterceptorsProcessor(req_interceptors, resolve, reject)(config)
        else resolve(config)
      })
      .then(function (config) {
        return new Parole(function (resolve, reject) {
          request = _makeRequest(config,
            res_interceptors.length ? _getInterceptorsProcessor(res_interceptors, resolve, reject, false) : resolve,
            res_error_interceptors.length ? _getInterceptorsProcessor(res_error_interceptors, resolve, reject, true) : reject
          )
        })
      })

  controller.config = config

  controller.abort = function () {
    if( request ) request.abort()
  }

  return controller
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
          url: isArray(url) ? url : [url]
        } : { method: method })
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
    base: function (url, _options) {
      var options = _options ? Object.create(_options) :{}
      if( url ) options.url = isArray(url) ? url : [url]
      return _httpBase( _requestMethod('get'), options, options_pile.concat(options) )
    },
    config: function (_options) {
      if( _options === undefined ) return plainOptions( options_pile.concat(options) )
      merge( options, _options )
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
  merge( http_defaults, options )
  return http
}

export default http
