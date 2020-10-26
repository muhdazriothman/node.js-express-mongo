/* eslint-disable no-useless-catch */
'use strict';
const debug = require('debug')('lib:authenticator');

const TokenGenerator = require('uuid-token-generator');

function generateToken() {
  try {
    const tokenGen = new TokenGenerator();
    const token = tokenGen.generate();
    return token;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  generateToken
};
