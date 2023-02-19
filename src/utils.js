/**
Author: Yusuf Bhabhrawala
 */
const _ = require("lodash");

const {typeShape} = require("@sleeksky/alt-schema");

const TYPES = {i: "integer", s: "string", b: "boolean", n: "number", o: "object", a: "array"};
const RX_OBJ = /(\{[^\{\}\[\]]+\})/;
const RX_ARR = /(\[[^\{\}\[\]]+\])/;
const RX_NESTED = /^\:?(\$[0-9]+)$/;
const RX_FLAT_ARR = /^\[([^\{\}\[\]]+)\]$/;
const RX_FLAT_OBJ = /^\{([^\{\}\[\]]+)\}$/;

const RX_BRACE = /\{([^\}]+)\}/g;
const RX_COLON = /\:([^\/]+)/g;


function toSwaggerSchema(str) {

  function traverse(schema, obj) {
    if (_.isArray(obj)) {
      schema.type = "array";
      schema.items = {};
      traverse(schema.items, obj[0]);
    } else if (_.isObject(obj)) {
      schema.type = "object";
      schema.properties = {};
      _.forOwn(obj, (v, k) => {
        schema.properties[k] = {};
        traverse(schema.properties[k], v);
      });
    } else {
      let [optional, type, def] = obj.split(":");
      optional = (optional === '?') ? true : false;
      if (['string','number','boolean','integer','array','object'].indexOf(type) < 0) type = "string"; 
      schema.type = type;
      if (def !== '') {
        if (type === 'number' || type === 'integer') def = def*1;
        if (type === 'boolean') def = ['true','1'].indexOf(def) > -1 ? true : false;
        schema.example = def;
      } else if (optional) {
        // schema.default = null;
      }
      if (!optional) schema.required = true;
    }
  }

  try {
    let obj = typeShape(str);
    let schema = {};
    traverse(schema, obj);
    return schema;
  } catch (error) {
    throw new Error(`Malformed schema: ${str}`);
  }
}

function pathParameters(str) {
  let params = [];
  let matches = str.match(RX_BRACE);
  if (!matches) matches = str.match(RX_COLON);
  if (matches) {
    params = matches.map(m => {
      let [p, def] = m.replace(/^[\{\:]/,"").replace(/[\}]$/,"").split(":");
      if (!def) def = "";
      return { in: "path", name: p, schema: { type: "string", example: def }, required: true };
    });
  }
  return params;
}

function pathClean(path) {
  if (path.match(RX_BRACE)) return path.replace(RX_BRACE, m => `${m.split(/(\:.+)?\}/)[0]}}`)
  return path;
}

// header:?token
function toParameter(inType, str) {
  if (!_.isString(str)) return str;
  str = str.replace(/ /g, "");
  let [name, type, def] = str.split(":");
  let required = true;
  if (type && type.match(/^\?/)) {
    type = type.replace(/^\?/, "");
    required = false;
  }
  if (type && TYPES[type]) type = TYPES[type];
  else type = "string";
  let schema = { type };
  if (def) schema.example = def;

  return {
    name,
    in: inType,
    required,
    schema
  }
}

module.exports = {toSwaggerSchema, pathParameters, pathClean, toParameter};