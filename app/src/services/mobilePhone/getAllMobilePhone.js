/* eslint-disable no-useless-catch */
const mobilePhone = require('../../models/mobilePhone');

async function getAllMobilePhone() {
  try {
    const result = await mobilePhone.getInstance().findAll();
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = { getAllMobilePhone };
