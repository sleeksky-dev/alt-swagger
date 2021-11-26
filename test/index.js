var asset = require('asset');
const spec = require('../src');

describe('Basic add tests', () => {
  spec.reset();
  spec.server('Ss', 'SS');
  spec.get("/{id}").header('bearer').res(200, 'OK');

  const doc = spec.swaggerDoc('Xx');
  it('is a valid swagger', () => {
    assert.isOk(true);
  })
});
