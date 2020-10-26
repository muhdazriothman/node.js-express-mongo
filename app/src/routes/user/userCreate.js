'use strict';

const logger = require('../../lib/logger/index')('routes:createUserHandler');
const util = require('util');
const { validatePayload } = require('../../lib/helperFunction');
const { createError } = require('../../lib/errorHandler/index');
const { createUser } = require('../../services/user');
const User = require('../../models/user');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function createUserHandler(req, res, next) {
  try {
    logger.debug(`Create user controller activated`);
    const payload = req.body;

    const payloadResult = await validatePayload(payload, User.getSchemaName().create);
    if (!payloadResult.isValid) {
      return next(createError.BadRequest(`Invalid payload: ${payloadResult.errorMessage}`));
    }

    const result = await createUser(payload);
    return res.status(201).json(result);
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

module.exports = createUserHandler;
