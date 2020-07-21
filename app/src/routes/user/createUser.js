'use strict';

const util = require('util');
const validator = require('../../lib/payloadValidation');
const errorHandler = require('../../lib/errorHandler');
const { createUser } = require('../../services/user/createUser');
const user = require('../../models/user');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function handleUserCreation(req, res, next) {
  try {
    const payload = req.body;
    const result = validator.validatePayload(user.getSchema(), payload);
    if (!result.isValid) {
      throw errorHandler.generateError(400, 'BadRequestError', result.errorMessage);
    }
    const record = await createUser(payload);
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

module.exports = handleUserCreation;
