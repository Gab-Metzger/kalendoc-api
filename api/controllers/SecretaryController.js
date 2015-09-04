'use strict';

var _ = require('lodash');

/**
 * SecretaryController
 *
 * @description :: Server-side logic for managing Secretaries
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
  create: function(req,res){
    var params    = req.allParams();
    const phone   = params.secr_phone;
    const address = params.address;

    // Removing secretary attribures for the user creation.
    delete params.secr_phone;
    delete params.address;

    User.create(params,function(err, user) {
      if (err) {
        res.json(400,{err: err});
      } else {
        Secretary.create({
          phone: phone,
          address: address,
          user: user
        }, function(err,secretary){
          if (err) { // If there is an error during secretary creation
            if (user.id) { // See DoctorController:46
              User.destroy(user.id,function(){ // Delete the user
                res.json(400,{err: err});
              });
            } else {
              res.json(400,{err:err});
            }
          } else {
            res.json({secretary: secretary});
          } // Secretary Creation OK
        }); // Secretary Create
      } // User Creation OK
    }); // User Create
  },

  update: function(req,res){
    var params = req.allParams();
    delete params.user; // Not allowing to change user.

    if (params.id) {
      if (params.id == req.user.secretary) {
        Secretary.update(params.id, params).exec(function(err,secr){
          if (err) {
            res.json(400,{err:err});
          } else {
            res.json(secr);
          }
        });
      } else {
        res.json(401, req.__('Error.Rights.Insufficient'));
      }
    } else {
      res.json(404, {err: req.__('Collection.Secretary')+" "+req.__('Error.NotFound')});
    }
  },

  findDoctors: function(req,res){
    const params = req.allParams();
    if (req.user.doctor) {
      Doctor.findOne(req.user.doctor).exec(function(err,doc){
        if (err) {
          res.json(500, {err: err});
        } else if (!doctor) {
          res.json(404, {err: req.__('Collection.Doctor'+" "+req.__('Error.NotFound'))});
        } else {
          Doctor.find({secretary: doc.secretary}).exec(function(err,docs){
            if (err) {
              res.json(500, {err:err});
            } else {
              res.json(docs);
            }
          });
        }
      });
    } else {
      params.id = params.id || req.user.secretary;
      Doctor.find({secretary: params.id}).exec(function(err,docs){
        if (err) {
          res.json(500,{err:err});
        } else {
          res.json(docs);
        }
      });
    }
  }
});

