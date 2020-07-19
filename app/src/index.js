'use strict';

/*
  General requires
*/
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const util = require('util');

/*
  Routes
*/
const api = require('./routes/api');

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.breakLength = Infinity;

const app = express();

/*
  Middleware setup
*/
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

/* RESTful API - Mobile Phone */
app.post('/api/v1.0/mobile-phone', /*Authenticator,*/ api.mobilePhone.createMobilePhone);
app.get('/api/v1.0/mobile-phone', /*Authenticator,*/ api.mobilePhone.getMobilePhone);
app.get('/api/v1.0/mobile-phone/:mobilePhoneId', /*Authenticator,*/ api.mobilePhone.getMobilePhone);
app.put('/api/v1.0/mobile-phone/:mobilePhoneId', /*Authenticator,*/ api.mobilePhone.updateMobilePhone);
app.delete('/api/v1.0/mobile-phone/:mobilePhoneId', /*Authenticator,*/ api.mobilePhone.deleteMobilePhone);

module.exports = app;
