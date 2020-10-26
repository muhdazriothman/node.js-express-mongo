'use strict';

const debug = require('debug')('lib:payloadValidator');
const util = require('util');
const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');

util.inspect.defaultOptions.breakLength = Infinity;
util.inspect.defaultOptions.depth = Infinity;

let ajv;
let validators = {};

const regexPatterns = {
  code: {
    pattern: '([-#*\\w]+)',
    name: 'number'
  },
  numberWithNegative: {
    pattern: '(-(\\d+)|(\\d+))',
    name: 'number'
  },
  number: {
    pattern: '(\\d+)',
    name: 'number'
  },
  numberWithinHundred: {
    pattern: '^$|^[0-9]{1,3}$',
    name: 'number'
  }
};

function loadSchema(schemaPath, options) {
  try {
    if (schemaPath.length == 0 || !fs.existsSync(schemaPath)) {
      throw new Error('schema file cannot be found.');
    }

    const defaults = {
      schemaId: '$id',
      nullable: true,
      allErrors: true,
      verbose: true
    };

    // extend options but not override default
    for (let option in options) {
      // eslint-disable-next-line no-prototype-builtins
      if (!defaults.hasOwnProperty(option)) {
        options[option] = defaults[option];
      }
    }

    // use defaults if options is null
    options = options || defaults;

    const schema = yaml.safeLoad(fs.readFileSync(schemaPath, 'utf8'));
    ajv = new Ajv(options);
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
    ajv.addSchema(schema, 'openapi.yaml');

    loadCustomKeywords();

    Object.keys(schema.components.schemas).forEach(function (key) {
      validators[key] = ajv.compile({
        $ref: `openapi.yaml#/components/schemas/${key}`
      });
    });

    debug(`schemas compilation completed.`);
  } catch (err) {
    debug(`Error occured when loading schema ${util.inspect(err)}`);
    throw err;
  }
}

function addValidator(key, ...params) {
  validators[key] = ajv.compile(...params);
}

function loadCustomKeywords() {
  // override with default value
  ajv.addKeyword('applyDefault', {
    compile: function (defaultValue) {
      if (!this._opts.useDefaults)
        return function () {
          return true;
        };
      return function (data, dataPath, parentData, parentDataProperty) {
        parentData[parentDataProperty] = defaultValue;
        return true;
      };
    }
  });

  // validate field which must be null
  ajv.addKeyword('mustBeNull', {
    errors: true,
    validate: function validate(schema, data) {
      if (schema !== true) return true;
      if (validate.errors === null) validate.errors = [];
      validate.errors.push({
        keyword: 'mustBeNull',
        message: 'should be null.',
        params: { keyword: 'auth' }
      });
      if (schema) {
        if (data !== null) return false;
      }
      return true;
    }
  });

  // validate predefined regex patterns and replace keyword
  ajv.addKeyword('x-pattern', {
    type: 'string',
    validate: function validate(patternName, data) {
      if (!(patternName in regexPatterns)) return false;
      if (validate.errors === null) validate.errors = [];

      validate.errors.push({
        keyword: 'pattern',
        params: {
          keyword: 'pattern',
          pattern: regexPatterns[patternName].name
        }
      });
      let patternVal = regexPatterns[patternName].pattern;
      let regex = RegExp(patternVal);

      return regex.test(data);
    }
  });

  // validate whitespace
  ajv.addKeyword('x-isNotEmpty', {
    type: 'string',
    validate: function validate(schema, data) {
      if (schema !== true) return true;
      if (validate.errors === null) validate.errors = [];

      // todo: add localized error message
      validate.errors.push({
        keyword: 'isNotEmpty',
        message: 'should not be blank'
      });
      return typeof data === 'string' && data.trim() !== '';
    }
  });
}

function showErrors(errors) {
  errors = errors || [];
  let errorMessage = '';
  let retErrors = [];

  errors.map(error => {
    const dataPathSplited = error.dataPath.split('.');
    let fieldName = dataPathSplited[dataPathSplited.length - 1];
    let schemaName = error.schemaPath.split('/')[3];
    let message = error.message;
    fieldName = fieldName || schemaName;

    if (error.keyword == 'oneOf') {
      fieldName = 'fields';
      error.schema.forEach(schema => {
        schemaName = schema.$ref.split('/')[3];
        message += `\n\tSchema [${schemaName}]: \n`;
        retErrors
          .filter(err => err.schema == schemaName)
          .map(err => {
            message += `\t${err.field} ${err.message}\n`;
            err.message = '';
          });
      });
    } else if (error.keyword == 'enum') {
      message += ' [' + error.params.allowedValues.join(',') + ']';
    }

    retErrors.push({
      schema: schemaName,
      field: fieldName,
      message
    });
  });

  retErrors
    .filter(err => err.message.length > 0)
    .map(err => {
      const field = err.field;
      errorMessage += field + ' ' + err.message + '\n';
    });

  return errorMessage;
}

module.exports = { loadSchema, validators, showErrors, addValidator };
