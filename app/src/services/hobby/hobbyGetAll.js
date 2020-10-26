/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:getAllHobby');
const User = require('../../models/user');

async function getAllHobby() {
  try {
    logger.debug(`About to get all hobby`);
    
    const users = await User.getInstance().findByCondition(null, { isDeleted: false });

    const uniqueHobbies = new Set();
    for (const user of users) {
      for (const hobby of user.hobbies) {
        uniqueHobbies.add(hobby);
      }
    }

    return Array.from(uniqueHobbies);
  } catch (err) {
    throw err;
  }
}

module.exports = { 
  getAllHobby
};
