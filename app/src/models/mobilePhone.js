'use strict';
const joi = require('joi');

const BaseModel = require('./baseModel');

const createSchema = joi.object({
  MODEL: joi.string()
    .min(1)
    .regex(/^[A-Z0-9]+(\s[A-Z0-9]+)?$/)
    .required(),

  MANUFACTURER: joi.string()
    .alphanum()
    .min(1)
    .required(),

  OPERATING_SYSTEM: joi.string()
    .alphanum()
    .min(1)
    .required(),

  TAGS: joi.array()
    .required(),

  COMMENTS: joi.array()
    .required()
});

const updateSchema = joi.object({
  MODEL: joi.string()
    .min(1)
    .regex(/^[A-Z0-9]+(\s[A-Z0-9]+)?$/)
    .required(),

  MANUFACTURER: joi.string()
    .alphanum()
    .min(1)
    .required(),

  OPERATING_SYSTEM: joi.string()
    .alphanum()
    .min(1)
    .required(),

  TAGS: joi.array()
    .required(),
  
  COMMENTS: joi.array()
    .required()
});

class MobilePhone extends BaseModel {
  constructor() {
    super();
    this.collectionName = 'MobilePhones';
  }
  static getInstance() {
    if (!this._instance) {
      this._instance = new MobilePhone();
    }
    return this._instance;
  }
  static getCreateSchema() {
    return createSchema;
  }
  static getUpdateSchema() {
    return updateSchema;
  }
}

module.exports = MobilePhone;
