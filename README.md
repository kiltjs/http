
# http-rest

`ajax / http` wrapper for browser and node that allows config inheritance ( uses [fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API) when present )

[![ᴋɪʟᴛ ᴊs](https://jesus.germade.dev/assets/images/badge-kiltjs.svg)](https://github.com/kiltjs)
[![npm](https://img.shields.io/npm/v/http.svg)](https://www.npmjs.com/package/http)
[![Build Status](https://travis-ci.org/kiltjs/http-rest.svg?branch=master)](https://travis-ci.org/kiltjs/http-rest)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

### Installation

> Node module

``` sh
npm install @kilt/http --save
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
var http_items = $http.base('items');

http_items.post({ prop1: 'value1' });

http_items.get(itemId);

http_items.put(itemId, {  prop1: 'another value' });

http_items.delete(itemId);
```
