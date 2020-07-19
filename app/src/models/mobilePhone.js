'use strict';
const BaseModel = require('./baseModel');

class MobilePhone extends BaseModel {
  constructor(obj) {
    super();
    this.data = obj;
    this.collectionName = 'MobilePhones';
  }
  static getInstance() {
    if (!this._instance) {
      this._instance = new MobilePhone();
    }
    return this._instance;
  }
}

module.exports = MobilePhone;
