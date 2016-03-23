http-browser
================
[![Bower version](https://badge.fury.io/bo/http-browser.svg)](http://badge.fury.io/bo/http-browser)
[![npm version](https://badge.fury.io/js/http-browser.svg)](http://badge.fury.io/js/http-browser)
Installation
------------
```.sh
npm install http-browser --save
```
or
```.sh
bower install http-browser --save
```

Usage
-----
``` js
$http.get('/items.json', { prop1: 'value1' });
// GET .../items.json?prop1=value1

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

Cached URL
----------
``` js
var httpItems = $http('items.json');

httpItems.get({ prop1: 'value1' });

httpItems.post({ prop1: 'value1' });

httpItems.put({	prop1: 'another value' });

httpItems.delete();

httpItems.patch({
	op: 'add', path: '/prop1', value: 'one more value'
});

httpItems.patch()
	.remove('/prop1')
	.add('/list/-', { subprop: 'sample value' })
	.submit();
```
