const ctx = require('@newspage/lib-commons/ctx');

function createAuditTrail(record) {
  return Object.assign(record, {
    VERSION: 1.0,
    CREATED_DATE: new Date().toISOString(),
    CREATED_BY: ctx.getUserInfo().userId,
    MODIFIED_DATE: new Date().toISOString(),
    MODIFIED_BY: ctx.getUserInfo().userId
  });
}

function updateAuditTrail(record) {
  return Object.assign(record, {
    VERSION: Number(record.VERSION) + 1.0,
    MODIFIED_DATE: new Date().toISOString(),
    MODIFIED_BY: ctx.getUserInfo().userId
  });
}

module.exports = {
  createAuditTrail,
  updateAuditTrail
};
