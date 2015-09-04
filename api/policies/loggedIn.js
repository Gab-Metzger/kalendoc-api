'use strict';
/**
 * loggedIn policy
 * Check for user token
 * Set :
 *  req.token with the current token
 *  req.user with the current user
 **/

module.exports = function(req,res,callback){
  var token = req.headers.token || req.param('token');
  if (!token) {
    return res.json(401, {err: req.__('Error.Token.Missing')});
  }

  delete req.query.token; // Deleting token to help blueprints.
  if (req.body && req.body.token) { // Deleting token to help models and controllers
    delete req.body.token;
  }

  JsonWebToken.verify(token, function(err,token){
    if (err) {
      return res.json(401, {err: req.__('Error.Token.Invalid')});
    }
    req.token = token;
    User.findOne(token.id).exec(function(err,user){
      if (err) {
        return res.json(500, {err:req.__('Error.Intern')});
      } else if (!user) {
        return res.json(401, {err:req.__('Error.Token.Invalid')});
      } else {
        req.user = user;
        callback();
      }
    });
  });
}