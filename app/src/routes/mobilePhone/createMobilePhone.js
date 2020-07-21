'use strict';

const util = require('util');
const validator = require('../../lib/payloadValidation');
const errorHandler = require('../../lib/errorHandler');
const { createMobilePhone } = require('../../services/mobilePhone/createMobilePhone');
const mobilePhone = require('../../models/mobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function handleMobilePhoneCreation(req, res, next) {
  try {
    const payload = req.body;

    if (Array.isArray(payload)) {
      for (const item of payload) {
        validateMultiPayload(item);
      }
    } else {
      validateMultiPayload(payload);
    }
    
    const record = await createMobilePhone(payload);
    return res.status(201).json(record);
  } catch (err) {
    if (
      err.errorName === 'BadRequestError' ||
      err.errorName === 'ConflictError' ||
      err.errorName === 'NotFoundError' || 
      err.errorName === 'ForbiddenError'
    ) {
      return res.status(err.status).json(err);
    }
    return next(err);
  }
}

function validateMultiPayload(obj) {
  const result = validator.validatePayload(mobilePhone.getCreateSchema(), obj);
  if (!result.isValid) {
    throw errorHandler.generateError(400, 'BadRequestError', result.errorMessage);
  }
}

module.exports = handleMobilePhoneCreation;
