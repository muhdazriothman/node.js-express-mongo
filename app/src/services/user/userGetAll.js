/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:getAllUser');
const User = require('../../models/user');

async function getAllUser() {
  try {
    logger.debug(`About to get all user`);
    
    const result = await User.getInstance().findByCondition(null, { isDeleted: false });
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { 
  getAllUser
};
