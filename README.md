jEngine: $http
================
[![Bower version](https://badge.fury.io/bo/jstools-http.svg)](http://badge.fury.io/bo/jstools-http)
[![npm version](https://badge.fury.io/js/jstools-http.svg)](http://badge.fury.io/js/jstools-http)

```.js
$http.get('/items.json');

$http.post('/items.json', {
	prop1: 'value1'
});

$http.put('/items.json', {
	prop1: 'another value'
});

$http.delete('/items.json');

$http.patch('/items.json', {
	op: 'add', path: '/prop1', value: 'one more value'
});

$http.patch('/items.json')
	.remove('/prop1')
	.add('/list/-', { subprop: 'sample value' })
	.submit();
```
