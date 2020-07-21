/* eslint-disable no-useless-catch */
const errorHandler = require('../../lib/errorHandler');

async function mobilePhoneCommonValidation(mobilePhoneData) {
  try {
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

module.exports = { mobilePhoneCommonValidation };