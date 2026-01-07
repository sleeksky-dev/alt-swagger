const express = require('express')
const app = express()
const swaggerUI = require('swagger-ui-express')
const docs = require('./dist');
docs.server('/', 'Localhost')

docs.get('/some-api').tag("demo").res(200, '{hello,world}');

docs.get('/:id')
  .tag("dot-notation")
  .query(['a','b:?'])
  .res(200, '{hello,world}');

docs.get('/:id/query')
  .tag("dot-notation")
  .query('a:s:hello,b:i:10')
  .res(200, '{hello,world}');


let refRequest = docs.ref.schema('example','{id:i:1,name:s:foo,optionalString:?s,optionalInt:?i,optionalBool:?b,defOptionalString:s:hello,defOptionalInt:i:12,defOptionalBool:b:false,label:{id:i:2,name:?s:bar},arr:[{a:b:false}]}');
docs.put('/:id')
  .tag("dot-notation")
  .req(refRequest)
  .res(200, '{hello,world}');

docs.patch('/:id')
  .tag("dot-notation")
  .req('{id:i:1,name:s:foo,optionalString:?s,optionalInt:?i,optionalBool:?b,defOptionalString:s:hello,defOptionalInt:i:12,defOptionalBool:b:false,label:{id:i:2,name:?s:bar},arr:[{a:b:false}]}')
  .res(200, '{hello,world}');

docs.patch('/:id/invalid').tag("dot-notation").summary("This must not show");

docs.post('/:id/some/:more')
  .tag("dot-notation")
  .summary('quick api docs examples')
  .desc("some description")
  .req('{id:i:1,mode:contentmode,name:s:foo,label:{id:i:2,name:?s:bar}}')
  .header('bearer:?')
  .query('qry:i')
  .res(200,'[{hello:s:test}]');

docs.del('/:id')
  .tag("dot-notation")
  .req('{a,b}')
  .res(200, '{hello,world}');


docs.post('/:id/other/:more', {
  tag: 'options',
  desc: 'some description',
  summary: 'this summary must not show',
  req: '{id:i:1,name:s:foo,label:{id:i:2,name:?s:bar}}',
  header: 'bearer:?',
  query: 'qry:i',
  "200": '[{hello:s:test}]'
});

docs.post('/:id/other/:more').summary('quick api docs examples')

docs.patch('/:id/invalid').remove();

docs.security('bearerAuth', {});
docs.get('/:id/security').security('bearerAuth');

docs.get('/to/remove/:id');
docs.remove({path: '/to/remove/:id'});

docs.get('/to/remove/:tag').tag('to-remove');
docs.post('/to/remove').tag('to-remove');
docs.remove({tag: 'to-remove'});

app.use('/', swaggerUI.serve, swaggerUI.setup(docs.swaggerDoc('Examples')));

let port = process.env['PORT'] || 9005;
app.listen(port, function () {
  console.log(`server started on port ${port}`)
})
