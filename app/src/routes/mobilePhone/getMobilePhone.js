'use strict';

const util = require('util');
const { getAllMobilePhone } = require('../../services/mobilePhone/getAllMobilePhone');
const { getMobilePhoneById } = require('../../services/mobilePhone/getMobilePhoneById');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function handleMobilePhoneRetrieval(req, res, next) {
  try {
    const mobilePhoneId = req.params.mobilePhoneId;

    let record;
    if (mobilePhoneId) {
      record = await getMobilePhoneById(mobilePhoneId);
      const httpStatusCode = record ? 200 : 404; // 200 - OK; 404 - No Found
      return res.status(httpStatusCode).json(record);
    } else {
      record = await getAllMobilePhone();
      const httpStatusCode = (record && record.length > 0) ? 200 : 204; // 200 - OK; 204 - No Content
      return res.status(httpStatusCode).json(record);
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = handleMobilePhoneRetrieval;
