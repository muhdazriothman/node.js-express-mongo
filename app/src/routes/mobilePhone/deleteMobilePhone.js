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
  } catch (error) {
    return next(error);
  }
}

module.exports = handleMobilePhoneDeletion;
