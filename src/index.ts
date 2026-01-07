/**
  Author: Yusuf Bhabhrawala
 */
import "./utils";
import * as _ from "lodash";
import { toSwaggerSchema, pathParameters, pathClean, toParameter, SwaggerSchema, PathParameter, Parameter } from "./utils";

interface Server {
  url: string;
  description?: string;
}

interface Tag {
  name: string;
  description?: string;
}

interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string | null;
  in?: string;
  required?: boolean;
}

interface Components {
  securitySchemes?: { [key: string]: SecurityScheme };
  schemas?: { [key: string]: SwaggerSchema };
  [key: string]: any;
}

interface ResponseSpec {
  content?: { [key: string]: { schema: SwaggerSchema } };
  description: string;
}

interface PathSpec {
  parameters: (PathParameter | Parameter)[];
  responses: { [key: string]: ResponseSpec };
  description: string;
  tags?: string[];
  summary?: string;
  security?: { [key: string]: string[] }[];
  deprecated?: boolean;
  requestBody?: {
    content: { [key: string]: { schema: SwaggerSchema } };
  };
}

interface Paths {
  [key: string]: {
    [method: string]: PathSpec;
  };
}

const paths: Paths = {};
const components: Components = {};
const tags: Tag[] = [];
const servers: Server[] = [];

function reset(): void {
  Object.keys(paths).forEach((key) => delete paths[key]);
  Object.keys(components).forEach((key) => delete components[key]);
  tags.splice(0, tags.length);
  servers.splice(0, servers.length);
}

function server(url: string, description?: string): void {
  servers.push({ url, description });
}

interface ApiOptions {
  path: string;
  method: string;
  tag?: string;
  desc?: string;
  summary?: string;
  req?: string;
  header?: string | string[];
  query?: string | string[];
  security?: string;
  deprecated?: boolean;
  [key: string]: any; // for numeric response codes
}

interface ApiExtension {
  req: (flatSch: string) => ApiExtension;
  res: (code: string | number, flatSch: string) => ApiExtension;
  query: (strArr: string | string[]) => ApiExtension;
  header: (strArr: string | string[]) => ApiExtension;
  tag: (str: string) => ApiExtension;
  summary: (str: string) => ApiExtension;
  desc: (str: string) => ApiExtension;
  security: (str: string) => ApiExtension;
  deprecate: () => ApiExtension;
  remove: () => void;
}

function api(opt: ApiOptions): ApiExtension {
  let path = `${pathClean(opt.path)}.${opt.method}`;
  let spec: PathSpec = _.get(paths as any, path, null) as PathSpec;
  if (!spec) {
    spec = { parameters: [], responses: {}, description: "" };
    const pathParams = pathParameters(opt.path);
    if (pathParams.length > 0) spec.parameters = pathParams;
    _.set(paths, path, spec);
  }

  let ext: ApiExtension = {} as ApiExtension;

  const req = (flatSch: string): ApiExtension => {
    let schema = flatSch.match(/^#/) ? { $ref: flatSch } : toSwaggerSchema(flatSch);
    spec.requestBody = {
      content: { "application/json": { schema } },
    };
    return ext;
  };
  const res = (code: string | number, flatSch: string): ApiExtension => {
    let schema = flatSch.match(/^#/) ? { $ref: flatSch } : toSwaggerSchema(flatSch);
    spec.responses[code] = {
      content: { [schema.type === "string" ? "text/plain" : "application/json"]: { schema } },
      description: "",
    };
    return ext;
  };
  const query = (strArr: string | string[]): ApiExtension => {
    if (!_.isArray(strArr)) strArr = (strArr as string).split(",");
    strArr.forEach((str) => {
      spec.parameters.push(toParameter('query', str));
    });
    return ext;
  };
  const header = (strArr: string | string[]): ApiExtension => {
    if (!_.isArray(strArr)) strArr = (strArr as string).split(",");
    strArr.forEach((str) => {
      spec.parameters.push(toParameter('header', str));
    });
    return ext;
  };
  const tag = (str: string): ApiExtension => { spec.tags = [str]; return ext; };
  const summary = (str: string): ApiExtension => { spec.summary = str; return ext; };
  const desc = (str: string): ApiExtension => { spec.description = str; return ext; };
  const security = (str: string): ApiExtension => { spec.security = [ { [str]: []}]; return ext; }
  const deprecate = (): ApiExtension => { spec.deprecated = true; return ext; };
  const remove = (): void => { _.unset(paths, `${pathClean(opt.path)}.${opt.method}`); };

  Object.assign(ext, { req, res, query, header, tag, summary, desc, deprecate, remove, security });

  // support all ext in parameters
  Object.keys(ext).forEach(k => {
    if (opt[k]) (ext as any)[k](opt[k]);
  });
  Object.keys(opt).filter(k => k.match(/^[0-9]+$/)).forEach(k => ext.res(parseInt(k), opt[k]));

  return ext;
}

function get(path: string = "", opt: Partial<ApiOptions> = {}): ApiExtension {
  opt.method = "get";
  opt.path = path;
  return api(opt as ApiOptions);
}

function post(path: string = "", opt: Partial<ApiOptions> = {}): ApiExtension {
  opt.method = "post";
  opt.path = path;
  return api(opt as ApiOptions);
}

function put(path: string = "", opt: Partial<ApiOptions> = {}): ApiExtension {
  opt.method = "put";
  opt.path = path;
  return api(opt as ApiOptions);
}

function patch(path: string = "", opt: Partial<ApiOptions> = {}): ApiExtension {
  opt.method = "patch";
  opt.path = path;
  return api(opt as ApiOptions);
}

function del(path: string = "", opt: Partial<ApiOptions> = {}): ApiExtension {
  opt.method = "delete";
  opt.path = path;
  return api(opt as ApiOptions);
}

interface RemoveOptions {
  path?: string;
  tag?: string;
}

function remove({path, tag}: RemoveOptions): void {
  if (path) _.unset(paths, `${pathClean(path)}`);
  if (tag) {
    Object.keys(paths).forEach(p => {
      Object.keys(paths[p]).forEach(method => {
        if (paths[p][method].tags && paths[p][method].tags!.includes(tag)) _.unset(paths[p], method);
      })
    });
  }
}

interface SecurityOptions {
  type?: string;
  schema?: string;
  bearerFormat?: string | null;
  required?: boolean;
}

function security(name: string, {type = "http", schema = "bearer", bearerFormat = null, required = true}: SecurityOptions = {}): string {
  components.securitySchemes = components.securitySchemes || {};
  components.securitySchemes[name] = { type, scheme: schema, bearerFormat, "in": "header", required };
  return `#/components/securitySchemes/${name}`;
}

interface RefOptions {
  type: string;
  name: string;
  def: SwaggerSchema;
}

function _ref({ type, name, def }: RefOptions): string {
  components[type] = components[type] || {};
  (components[type] as any)[name] = def;
  return `#/components/${type}/${name}`;
}

const ref = {
  schema(name: string, flatSch: string): string {
    return _ref({ type: "schemas", name, def: toSwaggerSchema(flatSch) });
  }
}

function tag(name: string, description?: string): void {
  tags.push({ name, description });
}

interface SwaggerDoc {
  info: { title: string; version: string };
  openapi: string;
  servers: Server[];
  tags: Tag[];
  paths: Paths;
  components: Components;
}

function swaggerDoc(title?: string): SwaggerDoc {
  return {
    info: { title: title || "", version: "1.0.0" },
    openapi: "3.0.0",
    servers,
    tags,
    paths,
    components,
  };
}

export {
  tag,
  server,
  ref,
  get,
  post,
  put,
  patch,
  del,
  security,
  swaggerDoc,
  reset,
  remove,
};

export type { ApiOptions, ApiExtension, SwaggerDoc };
