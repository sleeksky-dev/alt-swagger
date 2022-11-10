var assert = require('assert');
const spec = require('../src');
const { verify } = require('@sleeksky/alt-schema');

describe('Basic add tests', () => {
  it('is a valid swagger', () => {
    spec.reset();
    spec.server('Ss', 'SS');
    spec.get("/{id}").header('bearer').res(200, 'OK');
    const doc = spec.swaggerDoc('Xx');
    verify(doc, "{info,openapi,servers:[{url,description}],paths:{*:{}}}")
    assert(true);
  })
  it('has path param example', () => {
    spec.reset();
    spec.get("/{id:hello}");
    const doc = spec.swaggerDoc();
    verify(doc, "{paths:{*:{get:{parameters:[{schema:{type,example}}]}}}}")
    assert(Object.keys(doc.paths)[0] === '/{id}');
  })
});
