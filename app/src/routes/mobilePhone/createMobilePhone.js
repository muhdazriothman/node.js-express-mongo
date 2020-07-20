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
    const result = validator.validatePayload(mobilePhone.getCreateSchema(), payload);
    if (!result.isValid) {
      throw errorHandler.generateError(400, 'BadRequestError', result.errorMessage);
    }
    const record = await createMobilePhone(payload);
    return res.status(201).json(record);
  } catch (err) {
    if (
      err.errorName === 'BadRequestError' ||
      err.errorName === 'ConflictError' ||
      err.errorName === 'NotFoundError'
    ) {
      return res.status(err.status).json(err);
    }
    return next(err);
  }
}

module.exports = handleMobilePhoneCreation;
