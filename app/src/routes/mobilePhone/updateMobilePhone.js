'use strict';

const util = require('util');
const { updateMobilePhone } = require('../../services/mobilePhone/updateMobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function handleMobilePhoneUpdate(req, res, next) {
  try {
    const mobilePhoneId = req.params.mobilePhoneId;
    const mobilePhoneData = req.body;

    const record = await updateMobilePhone(mobilePhoneId, mobilePhoneData);
    return res.status(200).json(record);
  } catch (error) {
    return next(error);
  }
}

module.exports = handleMobilePhoneUpdate;
