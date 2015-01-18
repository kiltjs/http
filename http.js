
(function (definition) {
	'use strict';
	
	if ( typeof window !== 'undefined' ) {
		if( typeof Promise === 'undefined' ) {
			throw 'Promise is required for http to be defined';
		} else if ( window.fn ) {
			fn.define('http', definition);
		} else if( typeof Promise !== 'undefined' ) {
			window.http = definition();
		}
	}

})(function () {
	'use strict';

	function extend () {
		var auxArray = [],
			dest = auxArray.shift.call(arguments),
			src = auxArray.shift.call(arguments),
			key;

		while( src ) {
			for( key in src ) {
				dest[key] = src[key];
			}
			src = auxArray.shift.call(arguments);
		}

		return dest;
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

	function http(url, _options){

		if( url instanceof Object ) {
			_options = url;
			url = _options.url;
		}
		_options = _options || {};

		var options = extend({}, http.defaults), key;

		for( key in _options ) {
			if( _options[key] instanceof Function ) {
				_options[key] = _options[key]();
			}
			if( options[key] instanceof Function ) {
				options[key] = options[key]();
			}
			if( _options[key] instanceof Object ) {
				extend(options[key], _options[key])
			} else {
				options[key] = _options[key];
			}
		}

        if( !url ) {
        	throw 'url missing';
        	return false;
        }
        
        var request = null;
        try	{ // Firefox, Opera 8.0+, Safari
            request = new XMLHttpRequest();
        } catch (e) { // Internet Explorer
            try { request = new ActiveXObject("Msxml2.XMLHTTP"); }
            catch (e) { request = new ActiveXObject("Microsoft.XMLHTTP"); }
        }
        if (request===null) { throw "Browser does not support HTTP Request"; }
	        
		var p = new Promise(function (resolve, reject) {

	        request.open(options.method,url,(options.async === undefined) ? true : options.async);
	        request.onreadystatechange=function(){
	            if( request.readyState == 'complete' || request.readyState == 4 ) {

	            	request.headers = {};
	            	request.getAllResponseHeaders().replace(/\s*([^\:]+)\s*\:\s*([^\n]+)\s*\n/g, function (match, key, value) {
	            		request.headers[toCamelCase(key)] = value;
	            	});

	            	var data = request.responseText;
	            	if( request.headers.contentType === 'application/json' ) {
	            		data = JSON.parse(data);
	            	}

	                if( request.status >= 200 && request.status <300 ) {
	                	resolve( data, request.status, request);
	                } else {
	                    reject( data, request.status, request);
	                }
	            }
	        }

	        for( key in options.headers ) {
	        	request.setRequestHeader( toTitleSlug(key), options.headers[key]);
	        }
	        
	        request.send(options.data);
		});

		p.request = request;

		p.success = p.then;
		p.error = p.catch;
		p.complete = p.finally;

		return p;
    }

    http.defaults = {
    	method: 'get',
    	headers: {
	    	accept: 'application/json',
	    	contentType: 'application/json',
    		'hola': 'caracola'
    	}
    };

    return http;
});
