/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('lodash');

module.exports = {
  login: function(req,res){
    Login.login(req.param('email'),req.param('password'),req,function(err,code,user){
      if (!user) {
        return res.json(code,{err:err});
      } else {
        return res.json({
          user: user,
          token: JsonWebToken.create({id: user.id})
        });
      }
    });
  },
  logout: function(req, res) {
    if(req.isSocket) {
      _.forEach(req.param('data'), function(item) {
        sails.sockets.leave(req.socket, 'doctor' + item);
      });
    }
    return res.json(200, {message: "Successfully leave room"});
  }
};

