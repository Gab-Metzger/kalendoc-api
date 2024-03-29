'use strict';

var _ = require('lodash');
var async = require('async');
var passgen = require('pass-gen');
var crypto = require('crypto');
var moment = require('moment');
/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
  create: function(req,res){
    var params = req.allParams();
    if (!params.password) {
      params.password = passgen({
        ascii:true,
        ASCII:true,
        length:10,
        ambiguous:true
      });
    }
    User.create(params).exec(function(err, user){
      if (err) {
        return res.json(err.status, {err:err});
      }
      if (user) {
        res.json(200, {user: user, token: JsonWebToken.create({id:user.id})});
        var mergedVars={
          "email":user.email,
          "password":params.password
        };
        Mailer.sendMail( 'email-creation-compte', user.email ,mergedVars);
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
  },
  forgot: function (req, res) {
    async.waterfall([
      function (next) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          next(err, token);
        });
      },
      function (token, next) {
        User.findOne({email: req.param('email')}).populateAll().exec(function(err, user) {
          if (err) {
            return res.json(401, {err: req.__('Error.Rights.Insufficient')});
          } else if (!user) {
            return res.json(400, {err: req.__('Collection.User')+" "+req.__('Error.NotFound')});
          } else {
            user.resetPasswordToken = token;
            var resetPasswordExpires = moment().add(1, 'hour').toISOString(); // 1 hour

            User.update({id: user.id}, {
              resetPasswordToken: token,
              resetPasswordExpires: resetPasswordExpires
            })
            .exec(function(err) {
              next(err, token, user);
            });
          }
        });
      },
      function (token, user, next) {
        if (user.doctor) {
          var name = user.doctor.firstName;
        } else if (user.secretary) {
          var name = user.secretary.name;
        } else if (user.delegatedSecretary) {
          var name = user.delegatedSecretary.firstName;
        } else {
          var name = user.patient.firstName
        }

        var mergedVars = {
          "firstName":name,
          "token":token
        };

        Mailer.sendMail('email-password', user.email,mergedVars);
        return res.json(200, {message: 'Mail envoyé !'})
      }
    ], function (err) {
      if (err) return res.json(500, err);
    });
  },
  reset: function (req, res) {
    User.findOne({ resetPasswordToken: req.param('tokenPassword'), resetPasswordExpires: { '>=': new Date() } }, function(err, user) {
      if (!user) {
        return res.json(400, {err: 'Password reset token is invalid or has expired.'});
      }

      user.password = req.param('password');
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      user.save(function(err) {
        if (err) {
          return res.json(401, {err: req.__('Error.Rights.Insufficient')});
        } else {
          return res.json({message: 'Password Updated'});
        }
      });
    });
  }
});
