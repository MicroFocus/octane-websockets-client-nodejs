## Summary

`octane-websockets-client-nodejs` is intended to simplify connection to ALM Octane's WebSocket endpoints.

#### Usage

First, __bundle__ the library's relevant version to your package with package manager's standard ways.
(TODO: we should publish the library to NPM or something like this)

Next, __import__ the library into your code from wherever it is placed:

```javascript 1.8
const octaneWSClient = require('octane-ws-client');
```

This imported client can connect to multiple endpoints.

Use `connect` method to provide the configuration of the targeted WS endpoint.

This method may be called any number of times and will connect that number of WS clients, so call it wisely.

While performing connection, the library will:
- verify the configuration
- perform the login
- perform the connection
- bind your custom provided (if provided) `onMessage` method to the WS so that on any incoming message it'll be called

#### API
`connect`
  - async
  - receives __configuration object__
  - returns __Octane WebSocket client__
  
`configuration object` shaped as following:
```
{
  "isSSL": false,
  "octaneHost": "localhost",
  "octanePort": 8080,
  "sharedSpace": 1001,
  "endpoint": "webhooks",
  "onMessage": <function>,
  "client": "ws_yje4rozx2o21xtpxp3eeon2d0",
  "secret": "(ac51444da788a8b7K",
  "proxyHost": "",
  "proxyPort": ""
}
```
 
`Octane WebSocket client` shaped as following:
```
{
  "onError": <function>,
  "onMessage": <function>
}
```

> `onMessage` function MAY be passed as part of an initial configuration, and/or set later on, on the client object self.