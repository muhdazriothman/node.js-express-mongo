'use strict';

const logger = require('../../lib/logger/index')('routes:getHobbyHandler');
const util = require('util');
const { getAllHobby } = require('../../services/hobby');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function getHobbyHandler(req, res, next) {
  try {
    logger.debug(`Get hobby controller activated`);

    const result = await getAllHobby();

    const httpStatusCode = (result && result.length > 0) ? 200 : 204; // 200 - OK; 204 - No Content
    return res.status(httpStatusCode).json(result);
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

module.exports = getHobbyHandler;
