/**
Author: Yusuf Bhabhrawala
 */
const _ = require("lodash");

const TYPES = {i: "integer", s: "string", b: "boolean", n: "number", o: "object", a: "array"};
const RX_OBJ = /(\{[^\{\}\[\]]+\})/;
const RX_ARR = /(\[[^\{\}\[\]]+\])/;
const RX_NESTED = /^\:?(\$[0-9]+)$/;
const RX_FLAT_ARR = /^\[([^\{\}\[\]]+)\]$/;
const RX_FLAT_OBJ = /^\{([^\{\}\[\]]+)\}$/;

function toSwaggerSchema(str) {
  let nested = {};
  function flatten(str) {
    let m;
    while (m = str.match(RX_OBJ) || str.match(RX_ARR)) {
      let k = `$${Object.keys(nested).length}`;
      nested[k] = m[0];
      str = str.slice(0, m.index) + k + str.slice(m.index + m[0].length);
    }
    return str;
  }

  function getSchema(str) {
    if (!_.isString(str)) throw new Error("Schema must be a string");
    let m;
    if (m = str.match(RX_NESTED)) str = nested[m[1]];

    if (m = str.match(RX_FLAT_ARR)) {

      let schema = { type: "array" };
      let items = m[1].split(",").map(s => getSchema(`:${s}`)); // extra : to filter out key
      schema.items = items.length > 1 ? {oneOf: items} : items[0];
      return schema;

    } else if (m = str.match(RX_FLAT_OBJ)) {

      let schema = { type: "object" };
      let props = m[1];
      schema.properties = props.split(",").reduce((acc, curr) => {
        let k = curr.split(":")[0];
        acc[k] = getSchema(curr);
        return acc;
      }, {});
      return schema;

    } else { // scalar type

      let [key, type, def] = str.split(":");
      let required = null;
      if (type && type.match(/^\?/)) {
        type = type.replace(/^\?/, "");
        required = false;
      }
      if (type && type.match(/^\+/)) {
        type = type.replace(/^\+/, "");
        required = true;
      }
      if (type && TYPES[type]) type = TYPES[type];
      else if (type && type.match(RX_NESTED)) type = getSchema(type);
      else type = type || "string";

      let schema = _.isString(type) ? { type } : type;
      if (def) schema.default = def;
      if (required !== null) schema.required = required;
      // {type,default,required}
      return schema;
    }
  }
  str = str.replace(/\s/g, "");
  try {
    str = flatten(str);
    let schema = getSchema(str);
    schema.description = "";
    return schema;
  } catch (error) {
    throw new Error(`Malformed schema: ${str}`);
  }
}
_.mixin({ toSwaggerSchema });

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
_.mixin({ pathParameters });

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
_.mixin({ toParameter });
