/**
  Author: Yusuf Bhabhrawala
 */
require("./utils");
const _ = require("lodash");
const { toSwaggerSchema, pathParameters, pathClean, toParameter} = require("./utils")

const paths = {};
const components = {};
const tags = [];
const servers = [];

function reset() {
  Object.keys(paths).forEach((key) => delete paths[key]);
  Object.keys(components).forEach((key) => delete paths[key]);
  tags.splice(0, tags.length);
  servers.splice(0, servers.length);
}

function server(url, description) {
  servers.push({ url, description });
}

function api(opt) {
  let path = `${pathClean(opt.path)}.${opt.method}`;
  let spec = _.get(paths, path, false);
  if (!spec) {
    spec = { parameters: [], responses: {}, description: "" };
    const pathParams = pathParameters(opt.path);
    if (pathParams.length > 0) spec.parameters = pathParams;
    _.set(paths, path, spec);
  }

  let ext = {};

  const req = (flatSch) => {
    let schema = flatSch.match(/^#/) ? { $ref: flatSch } : toSwaggerSchema(flatSch);
    spec.requestBody = {
      content: { "application/json": { schema } },
    };
    return ext;
  };
  const res = (code, flatSch) => {
    let schema = flatSch.match(/^#/) ? { $ref: flatSch } : toSwaggerSchema(flatSch);
    spec.responses[code] = {
      content: { [schema.type === "string" ? "text/plain" : "application/json"]: { schema } },
      description: "",
    };
    return ext;
  };
  const query = (strArr) => {
    if (!_.isArray(strArr)) strArr = strArr.split(",");
    strArr.forEach((str) => {
      spec.parameters.push(toParameter('query',str));
    });
    return ext;
  };
  const header = (strArr) => {
    if (!_.isArray(strArr)) strArr = strArr.split(",");
    strArr.forEach((str) => {
      spec.parameters.push(toParameter('header',str));
    });
    return ext;
  };
  const tag = (str) => { spec.tags = [str]; return ext; };
  const summary = (str) => { spec.summary = str; return ext; };
  const desc = (str) => { spec.description = str; return ext; };
  const security = (str) => { spec.security = [ { [str]: []}]; return ext; }
  const deprecate = () => { spec.deprecated = true; return ext; };
  const remove = () => { _.unset(paths, `${pathClean(opt.path)}.${opt.method}`); };

  Object.assign(ext, { req, res, query, header, tag, summary, desc, deprecate, remove, security });

  // support all ext in parameters
  Object.keys(ext).forEach(k => {
    if (opt[k]) ext[k](opt[k]);
  });
  Object.keys(opt).filter(k => k.match(/^[0-9]+$/)).forEach(k => ext.res(k, opt[k]));

  return ext;
}

function get(path = "", opt = {}) {
  opt.method = "get";
  opt.path = path;
  return api(opt);
}

function post(path = "", opt = {}) {
  opt.method = "post";
  opt.path = path;
  return api(opt);
}

function put(path = "", opt = {}) {
  opt.method = "put";
  opt.path = path;
  return api(opt);
}

function patch(path = "", opt = {}) {
  opt.method = "patch";
  opt.path = path;
  return api(opt);
}

function del(path = "", opt = {}) {
  opt.method = "delete";
  opt.path = path;
  return api(opt);
}

function remove({path=null, tag=null}) {
  if (path) _.unset(paths, `${pathClean(path)}`);
  if (tag) {
    // remote all the paths with this tag
    Object.keys(paths).forEach(p => {
      Object.keys(paths[p]).forEach(method => {
        if (paths[p][method].tags && paths[p][method].tags.includes(tag)) _.unset(paths[p], method);
      })
    });
  }
}

function security(name, {type = "http", schema = "bearer", bearerFormat = null, required = true}) {
  components.securitySchemes = components.securitySchemes || {};
  components.securitySchemes[name] = { type, scheme: schema, bearerFormat, "in": "header", required };
  return `#/components/securitySchemes/${name}`;
}

function _ref({ type, name, def }) {
  components[type] = components[type] || {};
  components[type][name] = def;
  return `#/components/${type}/${name}`;
}

const ref = {
  schema(name, flatSch) {
    return _ref({ type: "schemas", name, def: toSwaggerSchema(flatSch) });
  }
}

function tag(name, description) {
  tags.push({ name, description });
}

function swaggerDoc(title) {
  return {
    info: { title: title || "", version: "1.0.0" },
    openapi: "3.0.0",
    servers,
    tags,
    paths,
    components,
  };
}

module.exports = {
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
