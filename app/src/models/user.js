'use strict';

const BaseModel = require('./baseModel');

const schema = {
  create: 'createUser',
  update: 'updateUser'
};

class User extends BaseModel {
  constructor() {
    super();
    this.collectionName = 'Users';
  }
  
  static getInstance() {
    if (!this._instance) {
      this._instance = new User();
    }
    return this._instance;
  }
  
  static getSchemaName() {
    return schema;
  }
}

module.exports = User;
