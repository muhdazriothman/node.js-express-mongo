/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:getUserById');
const User = require('../../models/user');

async function getUserById(userId) {
  try {
    logger.debug(`About to get user by id`);

    const result = await User.getInstance().findByCondition(null, { _id: userId });
    if (result.length > 0) {
      return result[0];
    } else {
      return;
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { 
  getUserById
};
