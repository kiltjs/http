
(function (definition) {
	'use strict';
	
	if ( typeof window !== 'undefined' ) {
		if ( window.fn ) {
			fn.define('http', [ 'Promise', definition ]);
		} else if( typeof Promise !== 'undefined' ) {
			window.http = definition(Promise);
		} else {
			throw 'Promise is required for http to be defined';
		}
	}

})(function (Promise) {
	'use strict';

	function ajax(url, args){

        if( !args ) args = ( url instanceof Object ) ? url : {};
        if( args.url ) url = args.url;
        if( !url ) return false;
        
        if( !args.method ) args.method = 'GET';
        
        if( !args.contentType ) {
            if( /^json$/i.test(args.mode) ) args.contentType = 'application/json';
            else args.contentType = 'application/x-www-form-urlencoded';
        }
        
        if( /^json$/i.test(args.mode) && isObject(args.data) ) args.data = JSON.stringify(args.data);
        
        var request = null;
        try	{ // Firefox, Opera 8.0+, Safari
            request = new XMLHttpRequest();
        } catch (e) { // Internet Explorer
            try { request = new ActiveXObject("Msxml2.XMLHTTP"); }
            catch (e) { request = new ActiveXObject("Microsoft.XMLHTTP"); }
        }
        if (request===null) { throw "Browser does not support HTTP Request"; }
	        
		var p = new Promise(function (resolve, reject) {

	        request.open(args.method,url,(args.async === undefined) ? true : args.async);
	        request.onreadystatechange=function(){
	            if( request.readyState == 'complete' || request.readyState == 4 ) {
	                if( request.status >= 200 && request.status <300 ) {
	                	var data = /^json$/i.test(args.mode) ? JSON.parse(request.responseText) : ( /^xml$/i.test(args.mode) ? request.responseXML : request.responseText );
	                	resolve(data, request.status, request);
	                } else {
	                    var data = /^json$/i.test(args.mode) ? JSON.parse(request.responseText) : ( /^xml$/i.test(args.mode) ? request.responseXML : request.responseText );
	                    reject(data, request.status, request);
	                }
	            }
	        }
	        
	        request.setRequestHeader('Content-Type',args.contentType);
	        request.setRequestHeader('X-Requested-With','XMLHttpRequest');
	        
	        if( args.headers ) {
	        	for( var header in args.headers ) {
	                request.setRequestHeader(header,args.headers[header]);
	        	}
	        }
	        
	        request.send(args.data);
		});

		p.request = request;

		return p;
    }

    return ajax;
});