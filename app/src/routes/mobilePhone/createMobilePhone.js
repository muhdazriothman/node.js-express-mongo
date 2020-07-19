'use strict';

const util = require('util');
const { createMobilePhone } = require('../../services/mobilePhone/createMobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function handleMobilePhoneCreation(req, res, next) {
  try {
    const record = await createMobilePhone(req.body);
    return res.status(201).json(record);
  } catch (error) {
    return next(error);
  }
}

module.exports = handleMobilePhoneCreation;
