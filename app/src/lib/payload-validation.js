'use strict';

const { validators, showErrors } = require('@newspage/lib-schema-validator');
const debug = require('debug')('lib:payload-validation');
const moment = require('moment');

var isValid = true;
var errorMessage = '';
var data;

async function validatePayload(req, schemaName) {
  debug(`validatePayload for module ${schemaName}`);
  data = req.body ? req.body : req;
  isValid = validators[schemaName](data);

  if (!isValid) {
    errorMessage = showErrors(validators[schemaName].errors);
    debug(errorMessage);
    return { isValid: isValid, errorMessage: errorMessage };
  } else
    return { isValid: isValid, errorMessage: errorMessage };
}

async function validateStartDate(data) {
  debug(`perform validateStartDate`);
  let todayDate = new Date().toISOString();
  if (data <= todayDate) {
    isValid = false;
    errorMessage = 'Start Date must be greater than Today date';
    debug(errorMessage);
    return { isValid: isValid, errorMessage: errorMessage };
  } else {
    isValid = true;
    return { isValid: isValid, errorMessage: errorMessage };
  }
}

async function validateStartEndDate(startDate, endDate) {
  debug(`validateStartEndDate for module`);
  if (endDate < startDate) {
    isValid = false;
    errorMessage = 'End Date cannot be earlier than Start Date';
    debug(errorMessage);
    return { isValid: isValid, errorMessage: errorMessage };
  } else {
    isValid = true;
    return { isValid: isValid, errorMessage: errorMessage };
  }
}

async function validateDate(date) {
  debug(`validateDate`);
  isValid = moment(date).isValid();
  if (!isValid) {
    errorMessage = 'Invalid Date';
    debug(errorMessage);
    return { isValid: isValid, errorMessage: errorMessage };
  } else {
    return { isValid: isValid, errorMessage: errorMessage };
  }
}

async function validateIdPayload(req, schemaName) {
  debug(`validateIdPayload for Scheme ${schemaName}`);
  isValid = validators[schemaName](req);

  if (!isValid) {
    errorMessage = showErrors(validators[schemaName].errors);
    return { isValid: isValid, errorMessage: errorMessage };
  } else
    return { isValid: isValid, errorMessage: errorMessage };
}

async function validateDuplicatePayload(jsonData) {
  debug(`validateDuplicatePayload`);
  let duplicated = false;
  if (jsonData.length > 1) {
    const objectKeys = Object.keys(jsonData[0]);
    for (let i = 0; i < jsonData.length; i++) {
      const currentObj = jsonData[i];
      const newJsonData = [...jsonData];
      newJsonData.splice(i, 1);
      for (let j = 0; j < objectKeys.length; j++) {
        const fieldName = Object.keys(currentObj)[j];
        const filter = newJsonData.filter(a => (a[fieldName] ? a[fieldName].toUpperCase() : a[fieldName]) == (currentObj[fieldName] ? currentObj[fieldName].toUpperCase() : currentObj[fieldName]));
        if (filter.length === 0) {
          duplicated = false;
          break;
        } else {
          duplicated = true;
        }
      }
      if (duplicated) break;
    }
  }
  if (duplicated) {
    isValid = false;
    errorMessage = 'Duplicate object found in payload';
    debug(errorMessage);
    return { isValid, errorMessage };
  } else {
    return { isValid, errorMessage };
  }
}

// function validatePrettyString(prettyStr) {
//   let regex = new RegExp('^[a-zA-Z0-9]{8}:[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$');
//   if (!regex.test(prettyStr)) {
//     return false;
//   }
//   return true;
// }

module.exports = {
  validatePayload: validatePayload,
  validateStartDate: validateStartDate,
  validateStartEndDate: validateStartEndDate,
  validateDate: validateDate,
  validateIdPayload: validateIdPayload,
  validateDuplicatePayload: validateDuplicatePayload
  // validatePrettyString: validatePrettyString
};