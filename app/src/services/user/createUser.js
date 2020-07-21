/* eslint-disable no-useless-catch */
const util = require('util');
const passwordHash = require('password-hash');
const common = require('./common');
const user = require('../../models/user');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

async function createUser(userData) {
  try {
    await common.userCommonValidation(userData);

    let newUser = Object.assign({}, userData);
    newUser.PASSWORD = passwordHash.generate(userData.PASSWORD);

    let result = await user.getInstance().insert(newUser);
    delete result.PASSWORD;
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { createUser };
