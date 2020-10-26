'use strict';

const { validators, showErrors } = require('./payloadValidator/index');
const debug = require('debug')('lib:helperFuntion');

async function validatePayload(payload, schemaName) {
  debug(`validatePayload for module ${schemaName}`);

  let isValid = true;
  let errorMessage = '';

  isValid = validators[schemaName](payload);

  if (!isValid) {
    errorMessage = showErrors(validators[schemaName].errors);
    debug(errorMessage);
    return { isValid: isValid, errorMessage: errorMessage };
  } else
    return { isValid: isValid, errorMessage: errorMessage };
}

module.exports = {
  validatePayload
};