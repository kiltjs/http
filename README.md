[![Bower version](https://badge.fury.io/bo/jstool-http.svg)](http://badge.fury.io/bo/jstool-http)

jstool-http
===========

```.js
http.get('/items.json');

http.post('/items.json', {
	prop1: 'value1'
});

http.put('/items.json', {
	prop1: 'another value'
});

http.delete('/items.json');

http.patch('/items.json', {
	op: 'add', path: '/prop1', value: 'one more value'
});

http.patch('/items.json')
	.remove('/prop1')
	.add('/list/-', { subprop: 'sample value' })
	.submit();
```