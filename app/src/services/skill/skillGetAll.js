/* eslint-disable no-useless-catch */
const logger = require('../../lib/logger/index')('services:getAllSkill');
const User = require('../../models/user');

async function getAllSkill() {
  try {
    logger.debug(`About to get all skill`);
    
    const users = await User.getInstance().findByCondition(null, { isDeleted: false });

    const uniqueSkills = new Set();
    for (const user of users) {
      for (const skill of user.skills) {
        uniqueSkills.add(skill);
      }
    }

    return Array.from(uniqueSkills);
  } catch (err) {
    throw err;
  }
}

module.exports = { 
  getAllSkill
};
