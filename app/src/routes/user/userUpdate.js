'use strict';

const logger = require('../../lib/logger/index')('routes:updateUserHandler');
const util = require('util');
const { validatePayload } = require('../../lib/helperFunction');
const { createError } = require('../../lib/errorHandler/index');
const { updateUser } = require('../../services/user');
const User = require('../../models/user');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function updateUserHandler(req, res, next) {
  try {
    logger.debug(`Update user controller activated`);
    const userId = req.params.userId;
    const payload = req.body;

    const validationQueue = [];
    validationQueue.push(await validatePayload(userId, 'Id')
      .then(result => {
        if (!result.isValid) {
          return next(createError.BadRequest(`Invalid payload: ${result.errorMessage}`));
        }
      })
    );
    validationQueue.push(await validatePayload(payload, User.getSchemaName().update)
      .then(result => {
        if (!result.isValid) {
          return next(createError.BadRequest(`Invalid payload: ${result.errorMessage}`));
        }
      })
    );
    await Promise.all(validationQueue);

    const result = await updateUser(userId, payload);
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

module.exports = updateUserHandler;
