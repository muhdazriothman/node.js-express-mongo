/* eslint-disable no-useless-catch */

function validatePayload(schema, payload) {
  try {
    let isValid = true;
    let errorMessage = '';

    const { error } = schema.validate(payload);
    if (error && error.message) {
      isValid = false;
      errorMessage = error.message;
    }

    return { isValid, errorMessage };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  validatePayload
};