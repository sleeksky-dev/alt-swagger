# Spec API

Quickly spec your APIs for Swagger / OpenAPI interface. Uses @sleeksky/alt-schema for specifying JSON schema.

# Example
```JavaScript
let refRequest = docs.ref.schema('example','{id:i:1,name:s:foo,label:{id:i:2,name:?s:bar},arr:[{a:b:false}]}');

docs.put('/:id').tag("dot-notation").req(refRequest).res(200, '{hello,world}');
```
![](https://i.ibb.co/ypWxGZJ/spec-api-ss1.png)
# Installation

npm install -s @sleeksky/alt-swagger

const docs = require('@sleeksky/alt-swagger');

# Usage

See example.js

# License

MIT © SleekSky
