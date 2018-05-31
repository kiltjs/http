
import http from './http-wrapper';
import xmlRequest from './request-xml';
import fetchRequest from './request-fetch';

var useRequest = http.useRequest,
    requests = { xml: xmlRequest, fetch: fetchRequest };

http.useRequest = function (request) {
  if( typeof request === 'string' ) {
    if( !requests[request] ) throw new Error('request type `' + request + '` missing');
    useRequest( requests[request] );
  } else if( !Function.prototype.isPrototypeOf(request) ) throw new Error('request should be a function');
  else useRequest( request );
};

useRequest( window.fetch ? requests.fetch : requests.xml );

export default http;
