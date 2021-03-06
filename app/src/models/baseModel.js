/* eslint-disable no-useless-catch */
const mongo = require('mongodb');

class BaseModel {
  constructor() {
    this.collectionName = '';
    this.objectSchema = '';
    this._initialized = false;
    this._instance = null;
    this._defaultDbUrl = 'mongodb://localhost:27017';
    this._defaultDbName = 'cdnDb';
    this._defaultFieldQuery = {};
  }

  async _init() {
    if (this._initialized) return;
    this._initialized = true;
  }

  async _openConn() {
    try {
      const client = await mongo.MongoClient.connect(this._defaultDbUrl, { useNewUrlParser: true });
      const db = client.db(this._defaultDbName);
      const collection = db.collection(this.collectionName);

      return { collection };
    } catch (err) {
      throw err;
    }
  }

  async insert(insertObjs) {
    try {
      const { collection } = await this._openConn();

      let response;
      if (Array.isArray(insertObjs)) {
        const result = await collection.insertMany([...insertObjs]);

        response = [];
        for (let i = 0; i < insertObjs.length; i++) {
          let responseObj = { ...insertObjs[i] };
          responseObj._id = result.insertedIds[i];
          response.push(responseObj);
        }

      } else {
        const result = await collection.insertOne({ ...insertObjs });
        response = { ...insertObjs };
        response._id = result.insertedId;
      }

      return response;
    } catch (err) {
      throw err;
    }
  }


  async findByCondition(fieldsQuery = {}, queryObj = {}) {
    try {
      if (queryObj._id) {
        queryObj._id = mongo.ObjectId(queryObj._id);
      }
      
      const { collection } = await this._openConn();

      const results = await collection.find(queryObj, fieldsQuery).toArray();
      return results;
    } catch (err) {
      throw err;
    }
  }

  async findById(fieldsQuery, id) {
    try {
      const results = await this.findByCondition(fieldsQuery, { _id: mongo.ObjectId(id) });

      if (results.length > 1) {
        throw new Error(`Unexpected result when retrieving record by id`);
      }

      return results[0];
    } catch (err) {
      throw err;
    }
  }

  async findAll(fieldsQuery) {
    try {
      let response = [];

      const results = await this.findByCondition(fieldsQuery, {});

      for (const result of results) {
        let resultObj = { ...result }; 
        response.push(resultObj);
      }

      return response;
    } catch (err) {
      throw err;
    }
  }

  async update(id, updateObj) {
    try {
      const { collection } = await this._openConn();

      const setQuery = { $set: { ...updateObj } };
      await collection.updateOne({ _id: mongo.ObjectId(id) }, setQuery);

      const response = { ...updateObj, _id: id };
      return response;
    } catch (err) {
      throw err;
    }
  }

  async delete(ids) {
    try {
      const { collection } = await this._openConn();

      let response;
      let deleteQuery = { _id: null };
      if (Array.isArray(ids)) {
        const uniqueIds = new Set(ids);

        const objectIds = [];
        uniqueIds.map(item => {
          objectIds.push(mongo.ObjectID(item));
        });

        deleteQuery._id.$in = [...objectIds];
      } else {
        deleteQuery._id = mongo.ObjectID(ids);
      }

      const result = await collection.deleteMany(deleteQuery);
      response = result.deletedCount;

      return response;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = BaseModel;
