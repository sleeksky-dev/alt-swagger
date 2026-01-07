# Alt Swagger

A fluent, programmatic API for generating OpenAPI 3.0 specifications. Quickly define your REST API endpoints with request/response schemas, parameters, security, and more using a simple, chainable syntax.

Built on top of [@sleeksky/alt-schema](https://github.com/sleeksky-dev/alt-schema) for intuitive JSON schema definitions.

## Features

- 🚀 **Fluent API**: Chain methods to define endpoints declaratively
- 📝 **Schema-first**: Define request/response schemas using simple string syntax
- 🔒 **Security**: Built-in support for authentication schemes
- 🏷️ **Rich Metadata**: Tags, summaries, descriptions, deprecation
- 🔄 **Reusable Schemas**: Define and reference schemas across endpoints
- 🎯 **TypeScript Support**: Full TypeScript definitions included
- 📊 **OpenAPI 3.0**: Generates valid OpenAPI 3.0 specifications

## Installation

```bash
npm install @sleeksky/alt-swagger
# or
yarn add @sleeksky/alt-swagger
# or
pnpm add @sleeksky/alt-swagger
```

## Quick Start

```javascript
const swagger = require('@sleeksky/alt-swagger');

// Define your API
swagger.server('https://api.example.com', 'Production API');

// Define endpoints
swagger.get('/users')
  .summary('Get users')
  .query('limit:i:10,offset:i:0')
  .res(200, '[{id:i,name:s,email:s}]');

swagger.post('/users')
  .summary('Create user')
  .req('{name:s,email:s}')
  .res(201, '{id:i,name:s,email:s}')
  .res(400, '{error:s}');

// Generate OpenAPI spec
const spec = swagger.swaggerDoc('User API', '1.0.0');
console.log(JSON.stringify(spec, null, 2));
```

## Schema Syntax

Alt Swagger uses a compact string syntax for defining JSON schemas, powered by alt-schema:

### Basic Types
- `s` - string
- `i` - integer
- `n` - number
- `b` - boolean
- `o` - object
- `a` - array

### Examples

```javascript
// Simple object
'{name:s, age:i}'

// With default values
'{name:s:John, age:i:25}'

// Optional fields (prefixed with ?)
'{name:s, age:?i, email:?s}'

// Nested objects
'{user:{name:s, age:i}, active:b}'

// Arrays
'[{id:i, name:s}]'

// Complex nested structure
'{id:i, profile:{name:s, settings:{theme:s:dark, notifications:b:true}}}'
```

## API Reference

### Core Methods

#### `swagger.server(url, description?)`
Define API servers.

```javascript
swagger.server('https://api.example.com', 'Production');
swagger.server('https://staging.api.example.com', 'Staging');
```

#### `swagger.tag(name, description?)`
Define tags for grouping endpoints.

```javascript
swagger.tag('Users', 'User management endpoints');
swagger.tag('Posts', 'Blog post endpoints');
```

### HTTP Methods

All HTTP methods return a fluent API for chaining:

#### `swagger.get(path)`
#### `swagger.post(path)`
#### `swagger.put(path)`
#### `swagger.patch(path)`
#### `swagger.del(path)` (or `swagger.delete(path)`)

```javascript
swagger.get('/users/{id}')
  .summary('Get user by ID')
  .res(200, '{id:i, name:s, email:s}')
  .res(404, '{error:s}');
```

### Path Parameters

Parameters in curly braces are automatically detected:

```javascript
// /users/{id} automatically creates path parameter 'id'
swagger.get('/users/{id}')
  .res(200, '{id:i, name:s}');

// With default values
swagger.get('/users/{id:123}')
  .res(200, '{id:i, name:s}');
```

### Fluent API Methods

#### `.req(schema)`
Define request body schema.

```javascript
swagger.post('/users')
  .req('{name:s, email:s, age:?i}')
  .res(201, '{id:i, name:s, email:s}');
```

#### `.res(statusCode, schema)`
Define response schema for a status code.

```javascript
swagger.get('/users')
  .res(200, '[{id:i, name:s}]')
  .res(404, '{error:s}')
  .res(500, '{error:s, code:i}');
```

#### `.query(params)`
Add query parameters. Accepts string or array.

```javascript
// Single parameter
swagger.get('/users').query('limit:i:10');

// Multiple parameters (comma-separated)
swagger.get('/users').query('limit:i:10,offset:i:0');

// Array format
swagger.get('/users').query(['limit:i:10', 'offset:i:0']);

// Optional parameters
swagger.get('/users').query('search:?s');
```

#### `.header(params)`
Add header parameters.

```javascript
swagger.get('/users')
  .header('authorization')
  .header('x-api-key:?');
```

#### `.tag(name)`
Add tags to the endpoint.

```javascript
swagger.get('/users')
  .tag('Users')
  .tag('Public');
```

#### `.summary(text)`
Add summary to the endpoint.

```javascript
swagger.get('/users')
  .summary('Retrieve a list of users');
```

#### `.desc(text)` or `.description(text)`
Add description to the endpoint.

```javascript
swagger.get('/users')
  .desc('Returns a paginated list of users with optional filtering');
```

#### `.security(name)`
Apply security scheme to the endpoint.

```javascript
swagger.get('/users')
  .security('bearerAuth');
```

#### `.deprecate()`
Mark endpoint as deprecated.

```javascript
swagger.get('/old-endpoint')
  .deprecate()
  .res(200, '{message:s}');
```

### Schema Management

#### `swagger.ref.schema(name, schema)`
Define reusable schemas.

```javascript
const userSchema = swagger.ref.schema('User', '{id:i, name:s, email:s}');
const errorSchema = swagger.ref.schema('Error', '{error:s, code:i}');

swagger.get('/users')
  .res(200, userSchema)
  .res(500, errorSchema);
```

### Security

#### `swagger.security(name, options?)`
Define security schemes.

```javascript
// Bearer token
swagger.security('bearerAuth');

// API Key
swagger.security('apiKey', {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key'
});

// Basic auth
swagger.security('basicAuth', {
  type: 'http',
  scheme: 'basic'
});
```

### Document Generation

#### `swagger.swaggerDoc(title?, version?)`
Generate the complete OpenAPI specification.

```javascript
const spec = swagger.swaggerDoc('My API', '1.0.0');
// Returns OpenAPI 3.0 compliant object
```

### Utility Methods

#### `swagger.reset()`
Clear all defined specifications.

```javascript
swagger.reset(); // Start fresh
```

#### `swagger.remove(options)`
Remove endpoints.

```javascript
// Remove specific path
swagger.remove({ path: '/users' });

// Remove by tag
swagger.remove({ tag: 'Deprecated' });
```

## Complete Examples

### Basic CRUD API

```javascript
const swagger = require('@sleeksky/alt-swagger');

swagger.server('https://api.example.com', 'User Management API');
swagger.tag('Users', 'User operations');

// Define schemas
const userSchema = swagger.ref.schema('User', '{id:i, name:s, email:s, created_at:s}');
const createUserSchema = swagger.ref.schema('CreateUser', '{name:s, email:s}');
const errorSchema = swagger.ref.schema('Error', '{error:s, code:i}');

// Security
swagger.security('bearerAuth');

// Endpoints
swagger.get('/users')
  .tag('Users')
  .summary('List users')
  .security('bearerAuth')
  .query('limit:?i:10,offset:?i:0')
  .res(200, `[${userSchema}]`)
  .res(401, errorSchema);

swagger.post('/users')
  .tag('Users')
  .summary('Create user')
  .req(createUserSchema)
  .res(201, userSchema)
  .res(400, errorSchema);

swagger.get('/users/{id}')
  .tag('Users')
  .summary('Get user by ID')
  .security('bearerAuth')
  .res(200, userSchema)
  .res(404, errorSchema);

swagger.put('/users/{id}')
  .tag('Users')
  .summary('Update user')
  .security('bearerAuth')
  .req(createUserSchema)
  .res(200, userSchema)
  .res(400, errorSchema)
  .res(404, errorSchema);

swagger.del('/users/{id}')
  .tag('Users')
  .summary('Delete user')
  .security('bearerAuth')
  .res(204)
  .res(404, errorSchema);

const spec = swagger.swaggerDoc('User API', '1.0.0');
```

### Express Integration

```javascript
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swagger = require('@sleeksky/alt-swagger');

const app = express();

// Define API spec
swagger.server('http://localhost:3000', 'Local API');

swagger.get('/health')
  .summary('Health check')
  .res(200, '{status:s, timestamp:s}');

swagger.get('/users/{id}')
  .summary('Get user')
  .res(200, '{id:i, name:s}');

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swagger.swaggerDoc('My API')));

// API routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/users/:id', (req, res) => {
  const user = { id: parseInt(req.params.id), name: 'John Doe' };
  res.json(user);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('API docs at http://localhost:3000/api-docs');
});
```

### Advanced Schema Examples

```javascript
const swagger = require('@sleeksky/alt-swagger');

// Complex nested schemas
const profileSchema = swagger.ref.schema('Profile', `
  {
    personal: {
      firstName: s,
      lastName: s,
      age: ?i,
      email: s
    },
    preferences: {
      theme: s:light,
      notifications: {
        email: b:true,
        push: b:false
      }
    },
    tags: [s]
  }
`);

// Array responses
swagger.get('/posts')
  .summary('Get blog posts')
  .query('category:?s,tag:?s,published:?b:true')
  .res(200, `
    [{
      id: i,
      title: s,
      content: s,
      author: {id:i, name:s},
      tags: [s],
      published: b,
      created_at: s
    }]
  `);

// Union-like responses (use oneOf in OpenAPI)
swagger.post('/upload')
  .summary('Upload file')
  .req('{file:s, type:s}')  // In practice, use multipart/form-data
  .res(200, '{id:s, url:s, size:i}')
  .res(400, '{error:s, code:s}');
```

## TypeScript Support

Alt Swagger includes full TypeScript definitions:

```typescript
import * as swagger from '@sleeksky/alt-swagger';

swagger.server('https://api.example.com');
swagger.get('/users').res(200, '[{id:number, name:string}]');

const spec: swagger.SwaggerDoc = swagger.swaggerDoc('API');
```

## Integration with Frameworks

### Fastify

```javascript
const fastify = require('fastify')();
const swagger = require('@sleeksky/alt-swagger');

// Define spec
swagger.server('http://localhost:3000');
swagger.get('/users').res(200, '[{id:i, name:s}]');

// Register Swagger
fastify.register(require('@fastify/swagger'), {
  specification: {
    document: swagger.swaggerDoc('Fastify API')
  }
});
```

### Hapi

```javascript
const Hapi = require('@hapi/hapi');
const swagger = require('@sleeksky/alt-swagger');

const server = Hapi.server({ port: 3000 });

// Define spec
swagger.server('http://localhost:3000');
swagger.get('/users').res(200, '[{id:i, name:s}]');

// Use hapi-swagger
server.register([
  require('hapi-swagger'),
  {
    options: {
      documentationPage: true,
      swaggerOptions: {
        spec: swagger.swaggerDoc('Hapi API')
      }
    }
  }
]);
```

## Best Practices

1. **Define schemas first**: Use `swagger.ref.schema()` for reusable schemas
2. **Use meaningful tags**: Group related endpoints with tags
3. **Document thoroughly**: Always include summaries and descriptions
4. **Handle errors**: Define error responses for all endpoints
5. **Version your API**: Use semantic versioning in `swaggerDoc()`
6. **Validate schemas**: Test your generated specs with OpenAPI validators

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT © [SleekSky](https://sleeksky.com)
