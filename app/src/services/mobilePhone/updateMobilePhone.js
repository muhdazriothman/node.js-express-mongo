/* eslint-disable no-useless-catch */
const util = require('util');
const errorHandler = require('../../lib/errorHandler');
const common = require('./common');
const mobilePhone = require('../../models/mobilePhone');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function updateMobilePhone(mobilePhoneId, mobilePhoneData) {
  try {
    await validateMobilePhoneData(mobilePhoneId, mobilePhoneData);
    const result = await mobilePhone.getInstance().update(mobilePhoneId, mobilePhoneData);
    return result;
  } catch (err) {
    throw err;
  }
}

async function validateMobilePhoneData(mobilePhoneId, mobilePhoneData) {
  try {
    common.mobilePhoneCommonValidation(mobilePhoneData);

    const promiseQueue = [];

    // validate mobile phone existence
    promiseQueue.push(mobilePhone.getInstance().findById(null, mobilePhoneId)
      .then(mobilePhoneFromDb => {
        if (!mobilePhoneFromDb) {
          throw errorHandler.generateError(404, 'NotFoundError', `Record with ID: '${mobilePhoneId}' not found`);
        }
        if (mobilePhoneFromDb.MODEL !== mobilePhoneData.MODEL) {
          throw errorHandler.generateError(404, 'BadRequestError', `MODEL cannot be modified`);
        }
      })
    );
   
    // validate duplicate mobile phone
    promiseQueue.push(mobilePhone.getInstance().findByCondition({}, { MODEL: `${mobilePhoneData.MODEL}` })
      .then(sameMobilePhone => {
        if (sameMobilePhone && sameMobilePhone.length === 1) {
          if (sameMobilePhone[0].ID.toUpperCase() !== mobilePhoneId.toUpperCase())
            throw errorHandler.generateError(409, 'ConflictError', `Duplicate record with MODEL: '${mobilePhoneData.MODEL}' found`);
        }    
      })
    );

    await Promise.all(promiseQueue);
  } catch (err) {
    throw err;
  }
}

module.exports = { updateMobilePhone, validateMobilePhoneData };
