'use strict';
const tap = require('tap');
// const req = require('supertest');
// const app = require('../src/index');
// var assert = require('assert');
// const db = require('@newspage/lib-commons/db');
// const { getRawFromPrettyStringId, getId } = require('@newspage/lib-commons/ident');
// const mslPrdHier = require('../src/models/msl-prd-hier');

tap.runOnly = true;

// let mslId = 'FF588627:906F7EB8-527C-4D5B-9647-E469AFAADA36';
// let hierId = '5E306ADB:35687BCA-FB0F-41D5-97A7-B99279CD713C';
// let mslPrdHierId;

tap.pass('Test file can be executed');

// tap.test(`Health Check for the API. Will run first`, async () => {
//   await req(app)
//     .get(`/api/v1.0/health-check`)
//     .expect(200);
// });


// tap.test(`Test Create and Test Get and Test Delete function for msl product hierarchy module`, async () => {
//   let createdTestingObject;
//   const hierRawId = await getRawFromPrettyStringId(hierId);
//   const hierTreeId = await getId(mslPrdHier.getModuleName());
//   const nodeId = await getId(mslPrdHier.getModuleName());
//   console.log('david2 : ' + hierTreeId.rawStr);
//   console.log('david3 : ' + nodeId.rawStr);
//   // HIER_TREE for ASS_ENTITY_ID - OPTIONAL
//   await db.submit(`INSERT INTO HIER_TREE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [hierTreeId.rawStr, 'GTRE', '00', hierRawId, 1, null,
//     'TESTING', 1, false, new Date().toISOString(), 'UNIT_TEST', new Date().toISOString(), 'UNIT_TEST']);
//   // NODE DATA for ASS_ENTITY_VALUE_ID
//   await db.submit(`INSERT INTO HIER_NODE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, ['00', nodeId.rawStr, hierTreeId.rawStr, 1, 1, false, new Date().toISOString(), 'UNIT_TEST', new Date().toISOString(), 'UNIT_TEST']);
//   await db.submit(`INSERT INTO HIER_DATA VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [nodeId.rawStr, 'NODE', 'UT', 'UNIT TESTING', '2019-07-11', '2999-10-29', 'Active', null, 1, false, new Date().toISOString(), 'UNIT_TEST', new Date().toISOString(), 'UNIT_TEST']);
//
//   // TEST CREATE API
//   const dataCreationObj = [{
//     "ASS_TYPE_ID": "DB782E8F:AD37C96A-342F-4120-B244-8807FA736FE8",
//     "PRD_HIER_ID": hierId,
//     "ASS_ENTITY_ID": hierTreeId.prettyStr,
//     "ASS_ENTITY_VALUE_ID": nodeId.prettyStr
//   }];
//   await req(app)
//     .post(`/api/v1.0/msl/${mslId}/msl-prd-hier`)
//     .send(dataCreationObj)
//     .expect(201)
//     .expect(res => {
//       if (res.body.length === 1) {
//         mslPrdHierId = res.body[0].ID;
//         console.log('david4 mslPrdHierId : ' + mslPrdHierId);
//       } else {
//         throw new Error('Create msl product hierarchy failed.');
//       }
//     });
//
//   // Test Get Api
//   await req(app)
//     .get(`/api/v1.0/msl/${mslId}/msl-prd-hier`)
//     .expect(200)
//     .expect(res => {
//       if (res.body.length > 0) {
//         createdTestingObject = res.body.filter(x => x.ID === mslPrdHierId);
//       } else {
//         throw new Error('Get msl product hierarchy failed.');
//       }
//     });
//   assert.equal(createdTestingObject[0].ID, mslPrdHierId);
//   assert.equal(createdTestingObject[0].ASS_ENTITY_VALUE_ID[0].nodeId, nodeId.prettyStr.toUpperCase());
//
//   // TEST Delete API
//   await req(app)
//     .delete(`/api/v1.0/msl/${mslId}/msl-prd-hier/${mslPrdHierId}`)
//     .expect(200).expect('1');
//
//   await db.submit(`DELETE FROM HIER_TREE WHERE ID = $1`, [hierTreeId.rawStr]);
//   await db.submit(`DELETE FROM HIER_NODE WHERE NODE_ID = $1`, [nodeId.rawStr]);
//   await db.submit(`DELETE FROM HIER_DATA WHERE ID = $1`, [nodeId.rawStr]);
//   const mslPrdHierRawId = await getRawFromPrettyStringId(mslPrdHierId);
//   const cleanQuery = await db.submit(`DELETE FROM MSL_PRD WHERE ID = $1 AND IS_DELETED = true`, [mslPrdHierRawId]);
//   assert.equal(cleanQuery, 1);
// });





