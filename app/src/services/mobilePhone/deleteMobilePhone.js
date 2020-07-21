/* eslint-disable no-useless-catch */
const errorHandler = require('../../lib/errorHandler');
const mobilePhone = require('../../models/mobilePhone');

async function deleteMobilePhone(mobilePhoneId) {
  try {
    await validateMobilePhone(mobilePhoneId);
    const result = await mobilePhone.getInstance().delete(mobilePhoneId);
    return result;
  } catch (err) {
    throw err;
  }
}

async function validateMobilePhone(mobilePhoneId) {
  try {
    // validate duplicate mobile phone
    const mobilePhoneFromDb = await mobilePhone.getInstance().findById(null, mobilePhoneId);
    if (!mobilePhoneFromDb) {
      throw errorHandler.generateError(404, 'NotFoundError', `Record with ID: '${mobilePhoneId}' not found`);
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { deleteMobilePhone, validateMobilePhone };
