/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:updateOrder');
const { createError } = require('../../lib/errorHandler/index');
const { getUserById } = require('./userGetById');
const { updateAuditTrail } = require('../base-service');
const User = require('../../models/user');

async function updateUser(userId, userData) {
  try {
    logger.debug(`About to update user`);
    
    const userInDb = await getUserById(userId);
    if (!userInDb) {
      throw createError.NotFound(`User not found`);
    }
    if (userInDb.version !== userData.version) {
      throw createError.Conflict(`User has been updated by another user`);
    }
    
    let updateUser = { ...userData };
    updateUser = updateAuditTrail(updateUser);

    const result = await User.getInstance().update(userId, updateUser);
    return result;
  } catch (err) {
    throw err;
  }
}
module.exports = { 
  updateUser
};
