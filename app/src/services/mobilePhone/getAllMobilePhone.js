/* eslint-disable no-useless-catch */
const util = require('util');
const mobilePhone = require('../../models/mobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function getAllMobilePhone() {
  try {
    const result = await mobilePhone.getInstance().findAll();
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { getAllMobilePhone };
