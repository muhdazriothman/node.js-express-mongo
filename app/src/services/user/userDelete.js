/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:deleteUser');
const { createError } = require('../../lib/errorHandler/index');
const { getUserById } = require('./userGetById');
const { updateAuditTrail } = require('../base-service');
const User = require('../../models/user');

async function deleteUser(userId) {
  try {
    logger.debug(`About to delete user`);

    const userInDb = await getUserById(userId);
    if (!userInDb) {
      throw createError.NotFound(`User not found`);
    }
  
    let updateUser = { isDeleted: true, version: userInDb.version };
    updateUser = updateAuditTrail(updateUser);

    const result = await User.getInstance().update(userId, updateUser);
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { 
  deleteUser
};
