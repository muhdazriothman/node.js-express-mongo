/* eslint-disable no-useless-catch */
const errorHandler = require('../../lib/errorHandler');
const common = require('./common');
const mobilePhone = require('../../models/mobilePhone');

async function createMobilePhone(mobilePhoneData) {
  try {
    await validateMobilePhone(mobilePhoneData);
    const result = await mobilePhone.getInstance().insert(mobilePhoneData);
    return result;
  } catch (err) {
    throw err;
  }
}

async function validateMobilePhone(mobilePhoneData) {
  try {
    common.mobilePhoneCommonValidation(mobilePhoneData);

    // validate duplicate mobile phone
    const mobilePhoneFromDb = await mobilePhone.getInstance().findByCondition({}, { MODEL: `${mobilePhoneData.MODEL}` });
    if (mobilePhoneFromDb && mobilePhoneFromDb.length > 0) {
      throw errorHandler.generateError(409, 'ConflictError', `Duplicate record with MODEL: '${mobilePhoneData.MODEL}' found`);
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { createMobilePhone, validateMobilePhone };
