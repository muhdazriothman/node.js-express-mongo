'use strict';

const util = require('util');
const { deleteMobilePhone } = require('../../services/mobilePhone/deleteMobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function handleMobilePhoneDeletion(req, res, next) {
  try {
    const mobilePhoneId = req.params.mobilePhoneId;

    const record = await deleteMobilePhone(mobilePhoneId);
    return res.status(200).json(record);
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

module.exports = handleMobilePhoneDeletion;
