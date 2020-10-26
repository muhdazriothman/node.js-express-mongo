'use strict';

const createError = require('http-errors');
const inherits = require('inherits');
const setPrototypeOf = require('setprototypeof');
// const config = require('../../config');
const fs = require('fs');
const util = require('util');
const path = require('path');
const debug = require('debug')('lib:err-handling-routes');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

// const errorFilePath = config('errors:path');

exports.notFound = (req, res, next) => {
  debug(`Resource Not found`);
  next(createError.NotFound('Resource Not found'));
};

exports.error = (err, req, res, next) => {
  debug(`Error found: ${util.inspect(err)}`);
  res.statusCode = err.statusCode || 500;
  let error = {
    status: res.statusCode,
    code: err.name || 'n/a',
    message: '',
    developerMessage: '',
    moreInfoUrl: '',
    silentMode: false,
    throwable: null
  };
  error = { ...error, ...err };

  res.format({
    html: () =>
      res.send(
        `<!doctype html><html lang="en"><head><title>${res.statusCode} ${error.code}</title></head><body>${res.statusCode} (${error.code}) &mdash; ${error.msg
        }<br/><a href="${error.moreInfoUrl}" /></body></html>`
      ),
    json: () => res.send(error),
    text: () => res.send(`ERROR: code=${res.statusCode} (${error.code}); ${error.msg}; more info url=${error.moreInfoUrl}; \n`),
    default: () => res.status(406).send(`Not Acceptable`)
  });

  next(new Error(err));
};

exports.createError = createError;

initialize(path.join(__dirname, '/error.json'));
// initialize(errorFilePath);

async function initialize(errorPath) {
  // if (!errorPath) {
  //   debug(`Errors path is not configured`);
  //   return;
  // }

  try {
    const content = fs.readFileSync(errorPath, 'utf8');
    // const readFile = util.promisify(fs.readFile);
    // const content = await readFile(errorFilePath);
    const errors = JSON.parse(content);
    errors.forEach(error => {
      let CodeError = registerError(error);
      if (CodeError) {
        exports.createError[error.status] = CodeError;
        exports.createError[error.code] = CodeError;
      }
    });
  } catch (err) {
    debug(`Error occurred when creating custom errors: ${util.inspect(err)}`);
  }
}

function registerError(error) {
  let name = error.code;
  let HttpError = createError.HttpError;
  let className = name.match(/Error$/) ? name : name + 'Error';

  function ClientError() {
    // create the error object
    let message, props;
    let args = Array.from(arguments);
    args.forEach(arg => {
      switch (typeof arg) {
        case 'string':
          message = arg;
          break;
        case 'object':
          props = arg;
          break;
      }
    });
    let msg = message != null ? message : error.message;
    let err = new Error(msg);

    // capture a stack trace to the construction point
    Error.captureStackTrace(err, ClientError);

    // adjust the [[Prototype]]
    setPrototypeOf(err, ClientError.prototype);

    // redefine the error message
    Object.defineProperty(err, 'message', {
      enumerable: true,
      configurable: true,
      value: msg,
      writable: true
    });

    // redefine the error name
    Object.defineProperty(err, 'name', {
      enumerable: false,
      configurable: true,
      value: className,
      writable: true
    });

    // overwrite defaults
    for (let key in props) {
      if (key !== 'code' && key !== 'message') {
        err[key] = props[key];
      }
    }

    return err;
  }

  inherits(ClientError, HttpError);
  nameFunc(ClientError, className);

  // set default
  ClientError.prototype.status = error.status;
  ClientError.prototype.statusCode = error.status;
  ClientError.prototype.code = error.code;
  ClientError.prototype.expose = true;
  ClientError.prototype.message = error.message;
  ClientError.prototype.developerMessage = error.developerMessage;
  ClientError.prototype.moreInfoUrl = error.moreInfoUrl;
  ClientError.prototype.critically = error.critically;
  ClientError.prototype.silentMode = error.silentMode;
  ClientError.prototype.throwable = error.throwable;

  return ClientError;
}

function nameFunc(func, name) {
  var desc = Object.getOwnPropertyDescriptor(func, 'name');

  if (desc && desc.configurable) {
    desc.value = name;
    Object.defineProperty(func, 'name', desc);
  }
}

exports.addErrors = initialize;