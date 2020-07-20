/* eslint-disable no-useless-catch */

function generateError(status, errorName, errorMessage) {
  return {
    status: status,
    errorName: errorName,
    errorMessage: errorMessage
  };
}

module.exports = {
  generateError
};