'use strict';
const tap = require('tap');
// const req = require('supertest');
// const app = require('../src/index');
// var assert = require('assert');
// const db = require('@newspage/lib-commons/db');
// const { getRawFromPrettyStringId } = require('@newspage/lib-commons/ident');
// const moment = require('moment');

tap.runOnly = true;

// const moduleName = 'msl';
// let mslId;
// const startDate = moment().add(1, 'day').format();
// const endDate = moment().add(1, 'year').format();

tap.pass('Test file can be executed');

// tap.test(`Health Check for the API. Will run first`, async () => {
//   await req(app)
//     .get(`/api/v1.0/health-check`)
//     .expect(200);
// });


// tap.test(`Test Create and Get By Id function for msl module`, async () => {
//   let responseBody;
//   const dataCreationObj = {
//     "MSL_DESC": "UNIT TESTING Must Sell List",
//     "START_DT": startDate,
//     "END_DT": endDate,
//     "TYPE": "M",
//     "STATUS": true
//   };
//   await req(app)
//     .post(`/api/v1.0/${moduleName}`)
//     .send(dataCreationObj)
//     .expect(201)
//     .expect(res => {
//       mslId = res.body.ID;
//     });
//
//   // Test Get By ID Api
//   await req(app)
//     .get(`/api/v1.0/${moduleName}/${mslId}`)
//     .expect(200)
//     .expect(res => {
//       responseBody = res.body;
//     });
//
//   assert.equal(responseBody.ID.toUpperCase(), mslId.toUpperCase());
//   assert.equal(responseBody.MSL_DESC, dataCreationObj.MSL_DESC);
//   assert.equal(responseBody.DIST_ASS_ALL, true);
//   assert.equal(responseBody.CUST_ASS_ALL, true);
//   assert.equal(responseBody.ROUTE_ASS_ALL, true);
//
//   const cleanId = await getRawFromPrettyStringId(mslId);
//   await db.submit(`DELETE FROM MSL WHERE ID = $1`, [cleanId]);
// });


// tap.test(`Test Create, Update, Get By ID, Delete function for msl module`, async () => {
//   let responseBody;
//   let mslCode;
//   const dataCreationObj = {
//     "MSL_DESC": "UNIT TESTING Must Sell List",
//     "START_DT": startDate,
//     "END_DT": endDate,
//     "TYPE": "M",
//     "STATUS": true
//   };
//   await req(app)
//     .post(`/api/v1.0/${moduleName}`)
//     .send(dataCreationObj)
//     .expect(201)
//     .expect(res => {
//       mslId = res.body.ID;
//       mslCode = res.body.MSL_CD;
//     });
//
//   // Test Update MSL Api
//   const dataUpdateObj = {
//     "ID": mslId,
//     "TENANT_ID": null,
//     "MSL_CD": mslCode,
//     "MSL_DESC": "UPDATE UNIT TESTING Must Sell List",
//     "START_DT": startDate,
//     "END_DT": endDate,
//     "TYPE": "M",
//     "DIST_ASS_ALL": true,
//     "CUST_ASS_ALL": true,
//     "ROUTE_ASS_ALL": true,
//     "STATUS": true,
//     "IS_DELETED": false,
//     "MODIFIED_DATE": "2019-08-29 06:27:58.836000000",
//     "MODIFIED_BY": "d860bf7a:778822e2-cd9a-4f25-b3de-469271666077",
//     "CREATED_DATE": "2019-08-29 06:27:58.836000000",
//     "CREATED_BY": "d860bf7a:778822e2-cd9a-4f25-b3de-469271666077",
//     "VERSION": 1
//   };
//   await req(app)
//     .put(`/api/v1.0/${moduleName}/${mslId}`)
//     .send(dataUpdateObj)
//     .expect(200);
//
//   // Test Get By ID Api
//   await req(app)
//     .get(`/api/v1.0/${moduleName}/${mslId}`)
//     .expect(200)
//     .expect(res => {
//       responseBody = res.body;
//     });
//   assert.equal(responseBody.ID.toUpperCase(), mslId.toUpperCase());
//   assert.equal(responseBody.MSL_CD, dataUpdateObj.MSL_CD);
//   assert.equal(responseBody.MSL_DESC, dataUpdateObj.MSL_DESC);
//
//   // TEST Delete API
//   await req(app)
//     .delete(`/api/v1.0/${moduleName}/${mslId}`)
//     .expect(200).expect('1');
//
//   const cleanId = await getRawFromPrettyStringId(mslId);
//   await db.submit(`DELETE FROM MSL WHERE ID = $1`, [cleanId]);
// });





