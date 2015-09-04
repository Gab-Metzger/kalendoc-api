'use strict';

/**
 * JsonWebToken
 **/

var jwt = require('jsonwebtoken')

// Create a web token with a given payload.
module.exports.create = function(payload){
  return jwt.sign(
    payload,
    sails.config.jwt.secret,
    {
      expiresInMinutes: sails.config.jwt.ttl
    }
  );
};

// Verify a web token.
module.exports.verify = function(token, callback){
  return jwt.verify(
    token,
    sails.config.jwt.secret,
    {}, // No options.
    callback
  );
};
