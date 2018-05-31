
import http from './http-wrapper';
import xmlRequest from './request-xml';

http.useRequest(xmlRequest);

export default http;
