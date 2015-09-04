'use strict';

var _ = require('lodash');
var passgen = require('pass-gen');

/**
 * PatientController
 *
 * @description :: Server-side logic for managing Patients
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
  create: function(req,res){
    var params = req.allParams();
    Patient.create(params).exec(function(err, patient){
      if (err) {
        res.json(400,{err:err});
      } else {
        res.json({patient: patient});
      }
    });
  },

  findName: function(req,res) {
    var params = req.allParams();
    if (params.name) {
      const names = params.name.split(' ');
      const req = [
        {firstName: {contains: names[0]}},
        {lastName: {contains: names[0]}}
      ];
      if ( names[1] ){
        names.shift();
        const name = names.join(" ");
        req.push({firstName: {contains: name}});
        req.push({lastName: {contains: name}});
      }

      Patient.find({or: req}).populate('user').exec(function(err,patients){
        if (err) {
          res.json(500, {err:err});
        } else {
          res.json(patients);
        }
      })
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  },

  findAppointments: function(req,res){
    var params = req.allParams();
    var query = {
      patient: params.id
    }
    if (params.start) {
      query.start = {
        '>=': params.start
      }
    }

    if (params.end) {
      query.end = {
        '<=': params.end
      }
    }
    RightsManager.canAdminPatient(req.user, params.id, function(auth){
      if (!auth) {
        res.json(401, {err: req.__('Error.Rights.Insufficient')});
      } else {
        Appointment.find(query).exec(function(err,results){
          if (err) {
            res.json(400,{err:err});
          } else {
            res.json(results);
          }
        });
      }
    })
  },

  update: function(req,res) {
    var params = req.allParams();
    delete params.user;
    if (params.id){
      var email = params.email;
      var phone = params.phone;
      delete params.email;
      delete params.phone;
      RightsManager.canAdminPatient(req.user, params.id, function(auth){
        if (!auth) {
          res.json(401, req.__('Error.Rights.Insufficient'))
        } else {
          console.log(params);
          Patient.update(params.id, params).exec(function(err, patient){
            if (err) {
              res.json(400, {err:err});
            } else if (patient[0]){
              if (!email && !phone) {
                User.findOne(patient[0].user).exec(function(err,user){
                  patient[0].user = user;
                  res.json(patient[0]);
                });
              } else {
                var user_params={};
                if (email) {
                  user_params.email = email;
                }
                if (phone) {
                  user_params.phone = phone;
                }

                User.update(patient[0].user,user_params).exec(function(err,user){
                  if (err) {
                    res.json(400, {err:err});
                  } else {
                    patient[0].user = user;
                    res.json(patient[0]);
                  }
                });
              }
            } else {
              res.json(404, {err: req.__('Collection.Patient')+" "+req.__('Error.NotFound')});
            }
          });
        }
      });
    } else {
      res.json(400, req.__('Error.Fields.Missing'));
    }
  }
});
