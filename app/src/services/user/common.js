/* eslint-disable no-useless-catch */
const errorHandler = require('../../lib/errorHandler');
const user = require('../../models/user');

async function userCommonValidation(userData) {
  try {
    // validate user
    const userFromDb = await user.getInstance().findByCondition({}, { USERNAME: `${userData.USERNAME}` });
    if (userFromDb && userFromDb.length > 0) {
      throw errorHandler.generateError(409, 'ConflictError', `Duplicate record with USERNAME: '${userData.USERNAME}' found`);
    }

    return { userFromDb };
  } catch (err) {
    throw err;
  }
}

module.exports = { userCommonValidation };