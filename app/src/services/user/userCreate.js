/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:createUser');
const { createError } = require('../../lib/errorHandler/index');
const { createAuditTrail } = require('../base-service');
const User = require('../../models/user');

async function createUser(userData) {
  try {
    logger.debug(`About to create user`);

    const sameEmailUser = await User.getInstance().findByCondition(null, { email: userData.email, isDeleted: false });
    if (sameEmailUser.length > 0) {
      throw createError.Conflict({ developerMessage: `Duplicate email found` });
    }

    let newUser = { ...userData };
    newUser.email = newUser.email.toUpperCase();
    newUser = createAuditTrail(newUser);

    const result = await User.getInstance().insert(newUser);
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { 
  createUser
};