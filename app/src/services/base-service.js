// const ctx = require('@newspage/lib-commons/ctx');

function createAuditTrail(record) {
  return { 
    ...record,
    version: 1.0,
    isDeleted: false,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString()
  };
}

function updateAuditTrail(record) {
  return { 
    ...record,
    version: Number(record.version) + 1.0,
    modifiedDate: new Date().toISOString()
  };
}

module.exports = {
  createAuditTrail,
  updateAuditTrail
};
