'use strict';

var _ = require('lodash');
var passgen = require('pass-gen');
/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
  create: function(req,res){
    var params = req.allParams();
    params.password = passgen({
      ascii:true,
      ASCII:true,
      length:10,
      ambiguous:true
    });
    User.create(params).exec(function(err, user){
      if (err) {
        return res.json(err.status, {err:err});
      }
      if (user) {
        res.json(200, {user: user, token: JsonWebToken.create({id:user.id})});
        Mailer.sendMail('email-creation-compte-kalendoc', user.email,[
            {name:"2_EMAIL",content:user.email},
            {name:"3_PASSWORD",content:params.password},
            {name:"4_LOGIN_URL",content:sails.config.appURL+"auth/login"}
        ],function(){});
      }
    });
  },
  update: function(req,res){
    var params = req.allParams()
    delete params.resetPassExpire;
    delete params.resetPassToken;
    delete params.secretary;
    delete params.doctor;
    delete params.smsAppointment;
    if (params.id) {
      if (params.id == req.user.id){
        User.update(params.id, params).exec(function(err,user){
          if (err) {
            res.json(400, {err:err})
          } else {
            res.json(user);
          }
        });
      } else {
        res.json(401, {err: req.__('Error.Rights.Insufficient')});
      }
    } else {
      res.json(400, {err: req.__('Collection.User')+" "+req.__('Error.NotFound')});
    }
  }
});
