'use strict';
const joi = require('joi');

const BaseModel = require('./baseModel');

const userSchema = joi.object({
  USERNAME: joi.string()
    .min(3)
    .required(),

  PASSWORD: joi.string()
    .required(8),
});

class MobilePhone extends BaseModel {
  constructor() {
    super();
    this.collectionName = 'Users';
  }
  static getInstance() {
    if (!this._instance) {
      this._instance = new MobilePhone();
    }
    return this._instance;
  }
  static getSchema() {
    return userSchema;
  }
}

module.exports = MobilePhone;
