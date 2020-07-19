/* eslint-disable no-useless-catch */
const util = require('util');
const mobilePhone = require('../../models/mobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function updateMobilePhone(mobilePhoneId, mobilePhoneData) {
  try {
    const result = await mobilePhone.getInstance().update(mobilePhoneId, mobilePhoneData);
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { updateMobilePhone };
