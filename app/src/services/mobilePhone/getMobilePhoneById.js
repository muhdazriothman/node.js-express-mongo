/* eslint-disable no-useless-catch */
const mobilePhone = require('../../models/mobilePhone');

async function getMobilePhoneById(mobilePhoneId) {
  try {
    const result = await mobilePhone.getInstance().findById(null, mobilePhoneId);
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { getMobilePhoneById };
