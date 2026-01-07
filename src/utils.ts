/**
Author: Yusuf Bhabhrawala
 */
import * as _ from "lodash";
// @ts-ignore
import { typeShape } from "@sleeksky/alt-schema";

const TYPES: { [key: string]: string } = { i: "integer", s: "string", b: "boolean", n: "number", o: "object", a: "array" };

const RX_BRACE = /\{([^\}]+)\}/g;
const RX_COLON = /\:([^\/]+)/g;

interface SwaggerSchema {
  type?: string;
  items?: SwaggerSchema;
  properties?: { [key: string]: SwaggerSchema };
  example?: any;
  required?: boolean;
  $ref?: string;
}

function toSwaggerSchema(str: string): SwaggerSchema {
  function traverse(schema: SwaggerSchema, obj: any): void {
    if (_.isArray(obj)) {
      schema.type = "array";
      schema.items = {};
      traverse(schema.items, obj[0]);
    } else if (_.isObject(obj)) {
      schema.type = "object";
      schema.properties = {};
      _.forOwn(obj, (v, k) => {
        schema.properties![k] = {};
        traverse(schema.properties![k], v);
      });
    } else {
      let [optional, type, def] = (obj as string).split(":");
      const isOptional = optional === '?';
      if (isOptional) {
        type = type || 'string';
      }
      if (['string','number','boolean','integer','array','object'].indexOf(type) < 0) type = "string";
      schema.type = type;
      if (def !== undefined && def !== '') {
        if (type === 'number' || type === 'integer') {
          schema.example = parseFloat(def);
        } else if (type === 'boolean') {
          schema.example = ['true','1'].indexOf(def) > -1;
        } else {
          schema.example = def;
        }
      }
      if (!isOptional) schema.required = true;
    }
  }

  try {
    const obj = typeShape(str);
    const schema: SwaggerSchema = {};
    traverse(schema, obj);
    return schema;
  } catch (error) {
    throw new Error(`Malformed schema: ${str}`);
  }
}

interface PathParameter {
  in: string;
  name: string;
  schema: { type: string; example?: string };
  required: boolean;
}

function pathParameters(str: string): PathParameter[] {
  let params: PathParameter[] = [];
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

function pathClean(path: string): string {
  if (path.match(RX_BRACE)) return path.replace(RX_BRACE, m => `${m.split(/(\:.+)?\}/)[0]}}`)
  return path;
}

interface Parameter {
  name: string;
  in: string;
  required: boolean;
  schema: { type: string; example?: string };
}

// header:?token
function toParameter(inType: string, str: string | Parameter): Parameter {
  if (!_.isString(str)) return str as Parameter;
  const cleanStr = str.replace(/ /g, "");
  let [name, type, def] = cleanStr.split(":");
  let required = true;
  if (type && type.match(/^\?/)) {
    type = type.replace(/^\?/, "");
    required = false;
  }
  if (type && TYPES[type]) type = TYPES[type];
  else type = "string";
  const schema: { type: string; example?: string } = { type };
  if (def) schema.example = def;

  return {
    name,
    in: inType,
    required,
    schema
  };
}

export { toSwaggerSchema, pathParameters, pathClean, toParameter };
export type { SwaggerSchema, PathParameter, Parameter };

module.exports = {toSwaggerSchema, pathParameters, pathClean, toParameter};