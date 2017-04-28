
# http-rest

`http` wrapper for browser and node that allows config inheritance ( uses [fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API) when present )

[![npm](https://img.shields.io/npm/v/http-rest.svg)](https://www.npmjs.com/package/http-rest) [![bower](https://img.shields.io/bower/v/http-rest.svg)](http://bower.io/search/?q=http-rest)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

### Installation

> Node module

``` sh
npm install http-rest --save
```
``` js
var $http = require('http-rest');
```

> Browser using node bundler

``` js
var $http = require('http-rest/browser');

// if you want to use fetch API when present
var $http = require('http-rest/fetch');
```

> Browser using bower

``` sh
bower install http-rest --save
```

``` js
// if you want to use fetch API when present (in bower.json)
// ...
"overrides": {
	"http-rest": {
		"main": "dist/fetch.js"
	}
},
// ...
```


### Usage

``` js
// GET .../items?prop1=value1
$http.get('/items', { params: { prop1: value1 } });

$http.post('/items', {
	sample: 'payload'
});

$http.put('/items/:itemId', {
	sample: 'payload'
});

$http.patch('/items/:itemId', {
	sample: 'payload'
});

$http.delete('/items/:itemId');
```

### Base configurations

``` js
var httpItems = $http.base('items');

httpItems.post({ prop1: 'value1' });

httpItems.get(itemId);

httpItems.put(itemId, {	prop1: 'another value' });

httpItems.delete(itemId);
```
