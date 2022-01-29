/**
Author: Yusuf Bhabhrawala
 */
const _ = require("lodash");

const {flatten, shape} = require("@sleeksky/alt-schema");

const TYPES = {i: "integer", s: "string", b: "boolean", n: "number", o: "object", a: "array"};
const RX_OBJ = /(\{[^\{\}\[\]]+\})/;
const RX_ARR = /(\[[^\{\}\[\]]+\])/;
const RX_NESTED = /^\:?(\$[0-9]+)$/;
const RX_FLAT_ARR = /^\[([^\{\}\[\]]+)\]$/;
const RX_FLAT_OBJ = /^\{([^\{\}\[\]]+)\}$/;

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
      schema.type = typeof obj;
    }
  }

  try {
    let obj = shape({}, str, {excludeOptional: false});
    let schema = {};
    traverse(schema, obj);
    return schema;
  } catch (error) {
    throw new Error(`Malformed schema: ${str}`);
  }
}

function pathParameters(str) {
  let params = [];
  const RX_BRACE = /\{([^\}]+)\}/g;
  const RX_COLON = /\:([^\/]+)/g;
  let matches = str.match(RX_BRACE);
  if (!matches) matches = str.match(RX_COLON);
  if (matches) {
    params = matches.map(m => {
      let p = m.replace(/[\{\}\:]/g, "");
      return { in: "path", name: p, schema: { type: "string" }, required: true };
    });
  }
  return params;
}

// header:?token
function toParameter(inType, str) {
  if (!_.isString(str)) return str;
  let [name, type] = str.split(":");
  let required = true;
  if (type && type.match(/^\?/)) {
    type = type.replace(/^\?/, "");
    required = false;
  }
  if (type && TYPES[type]) type = TYPES[type];
  else type = "string";

  return {
    name,
    in: inType,
    required,
    schema: { type }
  }
}

module.exports = {toSwaggerSchema, pathParameters, toParameter};