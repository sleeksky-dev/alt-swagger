const assert = require('assert');
const spec = require('../src');
// @ts-ignore
const { verify } = require('@sleeksky/alt-schema');

describe('Alt Swagger Library Tests', () => {
  beforeEach(() => {
    spec.reset();
  });

  describe('Basic functionality', () => {
    it('creates a valid swagger doc with server', () => {
      spec.server('http://localhost:3000', 'Local server');
      spec.get('/test').res(200, 'OK');
      const doc = spec.swaggerDoc('Test API');
      verify(doc, "{info:{title,version},openapi,servers:[{url,description}],paths:{*:{get:{responses:{200:{description}}}}}}");
      assert.equal(doc.info.title, 'Test API');
      assert.equal(doc.servers[0].url, 'http://localhost:3000');
    });

    it('handles path parameters with examples', () => {
      spec.get('/users/{id:123}');
      const doc = spec.swaggerDoc();
      const pathKey = Object.keys(doc.paths)[0];
      assert.equal(pathKey, '/users/{id}');
      assert.equal(doc.paths[pathKey].get.parameters[0].schema.example, '123');
    });

    it('handles multiple path parameters', () => {
      spec.get('/users/{userId}/posts/{postId:456}');
      const doc = spec.swaggerDoc();
      const params = doc.paths[Object.keys(doc.paths)[0]].get.parameters;
      assert.equal(params.length, 2);
      assert.equal(params[0].name, 'userId');
      assert.equal(params[1].name, 'postId');
      assert.equal(params[1].schema.example, '456');
    });
  });

  describe('HTTP methods', () => {
    it('supports POST method', () => {
      spec.post('/users').req('{name:s,age:i}').res(201, '{id:i,name:s,age:i}');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{post:{requestBody:{content:{*:{schema}}},responses:{201:{content:{*:{schema}}}}}}}}");
    });

    it('supports PUT method', () => {
      spec.put('/users/{id}').req('{name:s,age:i}').res(200, '{id:i,name:s,age:i}');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{put:{parameters,requestBody,responses}}}}");
    });

    it('supports PATCH method', () => {
      spec.patch('/users/{id}').req('{name:?s}').res(200, '{id:i,name:s}');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{patch:{parameters,requestBody,responses}}}}");
    });

    it('supports DELETE method', () => {
      spec.del('/users/{id}').res(204, '');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{delete:{parameters,responses:{204:{description}}}}}}");
    });
  });

  describe('Request and Response handling', () => {
    it('handles request body with ref', () => {
      const userSchema = spec.ref.schema('User', '{name:s,age:i}');
      spec.post('/users').req(userSchema).res(201, userSchema);
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{post:{requestBody:{content:{*:{schema:{$ref}}}},responses:{201:{content:{*:{schema:{$ref}}}}}}}},components:{schemas}}");
      assert(doc.components.schemas.User);
    });

    it('handles multiple response codes', () => {
      spec.get('/users/{id}').res(200, '{name:s,age:i}').res(404, '{error:s}');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{get:{parameters,responses:{200:{content:{*:{schema}}},404:{content:{*:{schema}}}}}}}}");
    });

    it('handles response without content (e.g., 204)', () => {
      spec.del('/users/{id}').res(204, '');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{delete:{parameters,responses:{204:{description}}}}}}");
      assert.equal(doc.paths[Object.keys(doc.paths)[0]].delete.responses[204].description, '');
    });
  });

  describe('Parameters', () => {
    it('handles query parameters', () => {
      spec.get('/users').query('limit:i:10,offset:i:0');
      const doc = spec.swaggerDoc();
      const params = doc.paths['/users'].get.parameters;
      assert.equal(params.length, 2);
      assert.equal(params[0].name, 'limit');
      assert.equal(params[0].schema.example, 10);
      assert.equal(params[1].name, 'offset');
      assert.equal(params[1].schema.example, 0);
    });

    it('handles optional query parameters', () => {
      spec.get('/users').query('search:?s');
      const doc = spec.swaggerDoc();
      const param = doc.paths['/users'].get.parameters[0];
      assert.equal(param.required, false);
    });

    it('handles header parameters', () => {
      spec.get('/users').header('authorization:?');
      const doc = spec.swaggerDoc();
      const param = doc.paths['/users'].get.parameters[0];
      assert.equal(param.in, 'header');
      assert.equal(param.name, 'authorization');
      assert.equal(param.required, false);
    });

    it('handles array parameters', () => {
      spec.get('/users').query(['ids', 'sort:?s:asc']);
      const doc = spec.swaggerDoc();
      const params = doc.paths['/users'].get.parameters;
      assert.equal(params.length, 2);
    });
  });

  describe('Metadata', () => {
    it('handles tags', () => {
      spec.get('/users').tag('Users');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{get:{tags}}}}");
      assert.deepEqual(doc.paths[Object.keys(doc.paths)[0]].get.tags, ['Users']);
    });

    it('handles summary and description', () => {
      spec.get('/users').summary('Get users').desc('Retrieve a list of users');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{get:{summary,description}}}}");
      const pathSpec = doc.paths[Object.keys(doc.paths)[0]].get;
      assert.equal(pathSpec.summary, 'Get users');
      assert.equal(pathSpec.description, 'Retrieve a list of users');
    });

    it('handles deprecated', () => {
      spec.get('/old-endpoint').deprecate();
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{get:{deprecated}}}}");
      assert.equal(doc.paths[Object.keys(doc.paths)[0]].get.deprecated, true);
    });
  });

  describe('Security', () => {
    it('defines security scheme', () => {
      const bearerRef = spec.security('bearerAuth');
      spec.get('/secure').security('bearerAuth');
      const doc = spec.swaggerDoc();
      verify(doc, "{paths:{*:{get:{security}}},components:{securitySchemes}}");
      assert(doc.components.securitySchemes.bearerAuth);
      assert.equal(bearerRef, '#/components/securitySchemes/bearerAuth');
    });

    it('handles security with custom options', () => {
      spec.security('bearerAuth');
      spec.get('/secure').security('bearerAuth');
      const doc = spec.swaggerDoc();
      assert(doc.components.securitySchemes.bearerAuth);
    });
  });

  describe('Removal and reset', () => {
    it('removes a specific path', () => {
      spec.get('/users').tag('Users');
      spec.post('/users').tag('Users');
      spec.remove({ path: '/users' });
      const doc = spec.swaggerDoc();
      assert(!doc.paths['/users']);
    });

    it('removes by tag', () => {
      spec.get('/users').tag('Users');
      spec.post('/posts').tag('Posts');
      spec.remove({ tag: 'Users' });
      const doc = spec.swaggerDoc();
      assert(!doc.paths['/users'].get);
      assert(doc.paths['/posts'].post);
    });

    it('resets all specs', () => {
      spec.server('http://localhost');
      spec.get('/test');
      spec.reset();
      const doc = spec.swaggerDoc();
      assert.equal(Object.keys(doc.paths).length, 0);
      assert.equal(doc.servers.length, 0);
    });
  });

  describe('Advanced features', () => {
    it('handles complex schemas', () => {
      spec.post('/users').req('{name:s,profile:{age:i,hobbies:[s]}}').res(201, '{id:i,name:s,profile:{age:i,hobbies:[s]}}');
      const doc = spec.swaggerDoc();
      assert(doc.paths['/users'].post.requestBody);
      assert(doc.paths['/users'].post.responses[201]);
    });

    it('handles multiple servers', () => {
      spec.server('http://prod.com', 'Production');
      spec.server('http://dev.com', 'Development');
      const doc = spec.swaggerDoc();
      verify(doc, "{servers:[{url,description},{url,description}]}");
      assert.equal(doc.servers.length, 2);
    });

    it('generates complete swagger doc', () => {
      spec.server('http://api.example.com', 'API Server');
      spec.tag('Users', 'User management');
      spec.security('bearerAuth');
      
      spec.get('/users')
        .tag('Users')
        .summary('List users')
        .query('limit:i:10')
        .security('bearerAuth')
        .res(200, '[{id:i,name:s}]');
      
      spec.post('/users')
        .tag('Users')
        .req('{name:s,email:s}')
        .res(201, '{id:i,name:s,email:s}');
      
      const doc = spec.swaggerDoc('User API', '1.0.0');
      verify(doc, "{info:{title,version},openapi,servers,tags,paths,components}");
      assert.equal(doc.info.title, 'User API');
      assert.equal(doc.info.version, '1.0.0');
      assert.equal(Object.keys(doc.paths).length, 1);
    });
  });
});
