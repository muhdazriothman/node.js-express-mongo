'use strict';

const logger = require('../../lib/logger/index')('routes:getUserHandler');
const util = require('util');
const { validatePayload } = require('../../lib/helperFunction');
const { createError } = require('../../lib/errorHandler/index');
const { getUserById, getAllUser } = require('../../services/user');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function getUserHandler(req, res, next) {
  try {
    logger.debug(`Get user controller activated`);
    const userId = req.params.userId;

    let result;
    if (userId) {
      const idResult = await validatePayload(userId, 'Id');
      if (!idResult.isValid) {
        return next(createError.BadRequest(`Invalid payload: ${idResult.errorMessage}`));
      }

      result = await getUserById(userId);
      const httpStatusCode = result ? 200 : 404; // 200 - OK; 404 - No Found
      return res.status(httpStatusCode).json(result);
    } else {
      result = await getAllUser();
      const httpStatusCode = (result && result.length > 0) ? 200 : 204; // 200 - OK; 204 - No Content
      return res.status(httpStatusCode).json(result);
    }
  }  catch (err) {
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

module.exports = getUserHandler;
