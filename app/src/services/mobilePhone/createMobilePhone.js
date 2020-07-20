/* eslint-disable no-useless-catch */
const util = require('util');
const errorHandler = require('../../lib/errorHandler');
const mobilePhone = require('../../models/mobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function createMobilePhone(mobilePhoneData) {
  try {
    await validateMobilePhoneData(mobilePhoneData);
    const result = await mobilePhone.getInstance().insert(mobilePhoneData);
    return result;
  } catch (err) {
    throw err;
  }
}

async function validateMobilePhoneData(mobilePhoneData) {
  try {
    // validate duplicate mobile phone
    const mobilePhoneFromDb = await mobilePhone.getInstance().findByCondition({}, { MODEL: `${mobilePhoneData.MODEL}` });
    if (mobilePhoneFromDb && mobilePhoneFromDb.length > 0) {
      throw errorHandler.generateError(409, 'ConflictError', `Duplicate record with MODEL: '${mobilePhoneData.MODEL}' found`);
    }

    // validate duplicate tags
    const tags = [...mobilePhoneData.TAGS];
    for (let i = 0; i < tags.length; i++) {
      const sameTag = tags.filter(item => item === tags[i]);

      if (sameTag.length > 1) {
        throw errorHandler.generateError(409, 'ConflictError', `Duplicate tag with TAG: '${tags[i]}' found`);
      }
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { createMobilePhone, validateMobilePhoneData };
