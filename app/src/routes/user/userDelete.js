'use strict';

const logger = require('../../lib/logger/index')('routes:deleteUserHandler');
const util = require('util');
const { validatePayload } = require('../../lib/helperFunction');
const { createError } = require('../../lib/errorHandler/index');
const { deleteUser } = require('../../services/user');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function deleteUserHandler(req, res, next) {
  try {
    logger.debug(`Delete user controller activated`);
    const userId = req.params.userId;

    const idResult = await validatePayload(userId, 'Id');
    if (!idResult.isValid) {
      return next(createError.BadRequest(`Invalid payload: ${idResult.errorMessage}`));
    }

    const result = await deleteUser(userId);
    return res.status(200).json(result);
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

module.exports = deleteUserHandler;
