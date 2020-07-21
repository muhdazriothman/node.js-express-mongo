/* eslint-disable no-useless-catch */
const errorHandler = require('./errorHandler');
const passwordHash = require('password-hash');
const user = require('../models/user');

function authenticator () {
  return async (req, res, next) => {
    try {
      // parse login and password from headers
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [userName, password] = Buffer.from(b64auth, 'base64').toString().split(':');
        
      const userFromDb = await user.getInstance().findByCondition({}, { USERNAME: `${userName.toUpperCase()}` });
      if (!userFromDb.length > 0) {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        res.status(401).send(errorHandler.generateError(401, 'ForbiddenError', 'Unable to authenticate user')); 
        throw new Error();
      }
        
      // Verify login and password are set and correct
      const result = passwordHash.verify(password, userFromDb[0].PASSWORD);
      if (!result) {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        res.status(401).send(errorHandler.generateError(401, 'ForbiddenError', 'Unable to authenticate user')); 
        throw new Error();
      }
    
      next();
    } catch (err) {
      next(err);
    } 
  };
}

module.exports = { authenticator };
