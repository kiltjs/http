
(function (root, factory) {
    'use strict';

    if ( typeof root !== 'undefined' ) {
        if ( root.define ) {
            define('$http', factory);
        } else if ( root.angular ) {
            var $http = factory();
            angular.module('jstools.http', [])
              .provider(function () {

                this.config = function (configFn) {
                  configFn.call(null, $http);
                };

                this.$get = function () {
                  return $http;
                };
              });
        } else if( !root.$http ) {
            root.$http = factory();
        }
    }

})(this, function () {
    'use strict';

    function _typeOf (type) {
      return function (o) {
        return typeof o === type;
      };
    }

    function _instanceOf (obj) {
      return function (o) {
        return o instanceof obj;
      };
    }

    var _isObject = _typeOf('object'),
        _isArray = _instanceOf(Array),
        _isFunction = _instanceOf(Function),
        _isString = _typeOf('string');

    function _copy (obj) {
      if( _isArray(obj) ) {
        var list = [];
        for( var i = 0, len = obj.length; i < len ; i++ ) {
          list[i] = _copy(obj[i]);
        }
        return list;
      } else if( _isObject(obj) ) {
        var o = {};
        for( var key in obj ) {
          o[key] = _copy(obj[key]);
        }
        return o;
      }
      return obj;
    }

    function _extend () {
        var auxArray = [],
            dest = auxArray.shift.call(arguments),
            src = auxArray.shift.call(arguments),
            key;

        while( src ) {
            for( key in src ) {
                if( _isObject(dest[key]) && _isObject(src[key]) ) {
                    dest[key] = _copy(src[key]);
                } else {
                    dest[key] = src[key];
                }
            }
            src = auxArray.shift.call(arguments);
        }

        return dest;
    }

    function _resolveFunctions (o) {
      for( var key in o ) {
        if( _isFunction(o[key]) ) {
          o[key] = o[key]();
        } else if( _isObject(o[key]) ) {
          _resolveFunctions(o[key]);
        }
      }
      return o;
    }

    function joinPath () {
        var path = (arguments[0] || '').replace(/\/$/, '');

        for( var i = 1, len = arguments.length - 1 ; i < len ; i++ ) {
            path += '/' + arguments[len].replace(/^\/|\/$/, '');
        }
        if( len ) {
            path += arguments[len] ? ( '/' + arguments[len].replace(/^\//, '') ) : '';
        }

        return path;
    }

    function serializeParams (params, prefix, notFirst) {
        if( params ) {

            prefix = prefix || '';
            notFirst = notFirst || 0;

            if( _isFunction(params) ) {
                return ( notFirst ? '&' : '' ) + encodeURIComponent(prefix) + '=' + encodeURIComponent( params() );
            } else if( _isObject(params) ) {
                var paramsStr = '';

                for( var key in params ) {
                    paramsStr += serializeParams( params[key], ( prefix ? (prefix + '.') : '' ) + key, notFirst++ );
                }

                return paramsStr;

            } else {
                return ( notFirst ? '&' : '' ) + encodeURIComponent(prefix) + '=' + encodeURIComponent(params);
            }

        } else return '';
    }

    function toTitleSlug(text) {
        var key = text[0].toUpperCase() + text.substr(1);
        return key.replace(/([a-z])([A-Z])/, function (match, lower, upper) {
            return lower + '-' + upper;
        });
    }

    function toCamelCase(text) {
        var key = text[0].toLowerCase() + text.substr(1);
        return key.replace(/([a-z])-([A-Z])/, function (match, lower, upper) {
            return lower + upper;
        });
    }

    function getStep( queue, fulfilled ) {
      var step = queue.shift(), method = fulfilled ? 'onFulfill' : 'onReject';

      while( step ) {
        if( step[method] ) {
          return step[method];
        }
        step = queue.shift();
      }

      return;
    }

    function processQueue (queue, data, fulfilled) {
        // console.log('processQueue', request, queue, data, fulfilled);

        var step = getStep( queue, fulfilled ),
            newData;

        if( step ) {

          try {
            newData = step(data);
            fulfilled = true;
          } catch (reason) {
            newData = reason;
            fulfilled = false;
          }

          if( newData && newData.then ) {
            newData.then(function (result) {
              processQueue(request, queue, result, true);
            }, function (reason) {
              processQueue(request, queue, reason, false);
            });
          } else {
            processQueue(queue, (newData === undefined) ? data : newData, fulfilled);
          }

        } else {
            step = queue.$finally.shift();

            while ( step instanceof Function ) {
              step(data);
              step = queue.$finally.shift();
            }
            return;
        }
    }

    function requestResponse (request, data) {
      return {
        data: data,
        status: request.status,
        request: request
      };
    }

    function processResponse (request, handlersQueue, catchCodes) {
        request.headers = {};
        request.getAllResponseHeaders().replace(/\s*([^\:]+)\s*\:\s*([^\;\n]+)/g, function (match, key, value) {
            request.headers[toCamelCase(key)] = value.trim();
        });

        var data = request.responseText;
        if( request.headers.contentType === 'application/json' ) {
            data = JSON.parse(data);
        } else if( request.headers.contentType === 'application/xml' ) {
            data = (new DOMParser()).parseFromString(data, 'text/xml');
        }

        if( catchCodes[request.status] ) {
            catchCodes[request.status].apply(request, [ data, function (data) {
                processQueue(handlersQueue, requestResponse(request, data), true);
            }, function (reason) {
                processQueue(handlersQueue, requestResponse(request, reason), true);
            } ]);
        } else if( request.status >= 200 && request.status < 300 ) {
            processQueue(handlersQueue, requestResponse(request, data), true);
        } else {
            processQueue(handlersQueue, requestResponse(request, data), false);
        }
    }

    function HttpUrl (url) {
        this.url = url;
    }

    ['get', 'head', 'options', 'post', 'put', 'delete', 'patch'].forEach(function (method) {
        HttpUrl.prototype[method] = function () {
            var args = [this.url];

            [].push.apply(args, arguments);

            return http[method].apply(null, args);
        };
    });

    function http (url, _options){

        url = _isArray(url) ? joinPath.apply(null, url) : url;

        if( _isObject(url) ) {
            _options = url;
            url = _options.url;
        }

        if( _options === undefined ) {
            return new HttpUrl(url);
        }

        var options = _resolveFunctions( _extend(_copy(http.defaults), _options) ),
            key,
            catchCodes = {},
            handlersQueue = [];

        if( !url ) {
            throw 'url missing';
            return false;
        }

        if( /^get$/.test(options.method) && _isObject(options.data) && Object.keys(options.data).length ) {
            console.log('options.data', options.data);
            url += '?' + serializeParams(options.data);
            options.data = null;
        }

        var request = null;
        try { // Firefox, Opera 8.0+, Safari
            request = new XMLHttpRequest();
        } catch (e) { // Internet Explorer
            try { request = new ActiveXObject("Msxml2.XMLHTTP"); }
            catch (e) { request = new ActiveXObject("Microsoft.XMLHTTP"); }
        }
        if (request===null) { throw "Browser does not support HTTP Request"; }

        request.open( options.method.toUpperCase(), url, (options.async === undefined) ? true : options.async );

        for( key in options.headers ) {
            request.setRequestHeader( toTitleSlug(key), options.headers[key] );
        }

        request.onreadystatechange = function(){
            if( request.readyState === 'complete' || request.readyState === 4 ) {
                processResponse(request, handlersQueue, catchCodes);
            }
        };

        if( options.data !== undefined && !_isString(options.data) ) {
            options.data = JSON.stringify(options.data);
        }

        request.send( options.data );

        request.then = function (onFulfilled, onRejected) {
            if( _isFunction(onFulfilled) ) {
                handlersQueue.push({ onFulfill: onFulfilled, onReject: onRejected });
            }
            return request;
        };

        request.catch = function (onRejected) {
            if( _isFunction(onRejected) ) {
                handlersQueue.push({ onFulfill: null, onReject: onRejected });
            }
            return request;
        };

        handlersQueue.$finally = [];

        request.finally = function (onAlways) {
            handlersQueue.$finally.push(onAlways);
            return request;
        };

        return request;
    }

    http.defaults = {
        method: 'get',
        headers: {
            contentType: 'application/json'
        }
    };

    ['get', 'head', 'options', 'post', 'put', 'delete'].forEach(function (method) {
        http[method] = function (url, data, _options){

            url = ( _isArray(url) ) ? joinPath.apply(null, url) : url;

            if( _isObject(url) ) {
                _options = url;
                url = _options.url;
            }
            _options = _options || {};
            _options.data = data;
            _options.method = method;

            return http(url, _options);
        }
    });

    http.patch = function (url, data, options) {

        url = ( _isArray(url) ) ? joinPath.apply(null, url) : url;

        if( _isObject(url) ) {
            url.method = 'patch';
            return http(url);
        } else if( _isString(url) ) {
            options = _isObject(options) ? options : {};

            if( data ) {
                return http(url, _extend(options, {
                    method: 'patch',
                    data: data
                }) );
            } else {
                var patchOps = [],
                    addOp = function (patchOp) {
                        patchOps.push(patchOp);
                        return patchHandler;
                    },
                    patchHandler = {
                        add: function (path, value) {
                            return addOp({ op: 'add', path: path, value: value });
                        },
                        test: function (path, value) {
                            return addOp({ op: 'test', path: path, value: value });
                        },
                        replace: function (path, value) {
                            return addOp({ op: 'replace', path: path, value: value });
                        },
                        move: function (from, path) {
                            return addOp({ op: 'move', from: from, path: path });
                        },
                        copy: function (from, path) {
                            return addOp({ op: 'copy', from: from, path: path });
                        },
                        remove: function (path) {
                            return addOp({ op: 'remove', path: path });
                        },

                        flush: function () {
                            patchOps.splice(0, patchOps.length);
                            return patchHandler;
                        },

                        submit: function (data) {

                            data = data || patchOps;

                            return http(url, _extend(options, {
                                method: 'patch',
                                data: data
                            }) );
                        }
                    };

                return patchHandler;
            }

        }
    };

    return http;
});
