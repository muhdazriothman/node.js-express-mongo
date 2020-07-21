'use strict';

/*
  General requires
*/
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const util = require('util');
const { authenticator } = require('./lib/authenticator');

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
app.use(authenticator());

app.post('/api/v1.0/user', api.user.createUser);

/* RESTful API - Mobile Phone */
app.post('/api/v1.0/mobile-phone', api.mobilePhone.createMobilePhone);
app.get('/api/v1.0/mobile-phone', api.mobilePhone.getMobilePhone);
app.get('/api/v1.0/mobile-phone/:mobilePhoneId', api.mobilePhone.getMobilePhone);
app.put('/api/v1.0/mobile-phone/:mobilePhoneId', api.mobilePhone.updateMobilePhone);
app.delete('/api/v1.0/mobile-phone/:mobilePhoneId', api.mobilePhone.deleteMobilePhone);

module.exports = app;
