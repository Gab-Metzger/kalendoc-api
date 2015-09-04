'use strict';
/**
 * Login.js
 *
 * Login service. Used for basic authentication
 **/

// Return the user corresponding.
// Callback :
//  - err
//  - HTTP code
//  - user

module.exports.login = function(email,password,req,callback){
  if (!email) {
    return callback(req.__('Error.Email.Missing'),400);
  }

  if (!password) {
    return callback(req.__('Error.Password.Missing'),400);
  }

  User.findOne({email: email}).populate("doctor").populate("secretary").exec(function(err,user){
    if (err) {
      return callback(err,500);
    }
    if (!user) {
      return callback(req.__("Error.Email.NotFound"),400);
    }
    user.comparePassword(password, function(err,valid){
      if (err) {
        return callback(err,500);
      }
      if (!valid) {
        return callback(req.__('Error.Password.Wrong'),400);
      } else {
        return callback(null,200,user);
      }
    }); // User : ComparePassword
  }); // User : findOne
}