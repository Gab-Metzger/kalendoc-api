'use strict';

var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var uuid = require('uuid');

/**
 * AppointmentController
 *
 * @description :: Server-side logic for managing Appointments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

  subscribe: function(req, res) {
    if (req.isSocket) {
      Appointment.watch(req.socket);
      console.log("Doctor or Secretary subscribe to " + req.socket.id);
    }
  },

  create: function(req,res){
    var params = req.allParams();
    if (!(params.patient && params.category) && (params.state != 'blockedByDoctor')){
      res.json(400, {err: req.__('Error.Fields.Missing')});
    } else {

      if (!params.source) {
        params.source = 'doctor';
        params.acceptToken = uuid.v1(); // Using time based token
      } else {
        params.state = 'accepted';
      }

      Appointment.create(params).exec(function(err,app){
        if (err) {
          res.json(err.status, {err:err});
        } else {
          console.log("Created Appointment");
          console.log(app);
          Appointment.findOne(app.id).populate('patient').populate('doctor').populate('category').exec(function(err,app){
            res.json(200,{appointment:app});
            Appointment.publishCreate(app);
            var doctor = app.doctor;
            if (app.state === "waitingForUserAcceptation") {
              // Send mail
            } else if (app.patient) {
              // Send confirmation mail
              Patient.findOne(app.patient).exec(function(err,patient){
                if (!patient) {
                  Slack.sendAPIMessage("[Mailer] Create appointment : patient not found : "+err);
                } else {
                  Secretary.findOne(doctor.secretary).exec(function(err,secretary){
                    if (!secretary) {
                      Slack.sendAPIMessage("[MAILER] Create appointment : secretary not found : "+err);
                    } else if (patient.email) {
                      var emailContent = [
                        {name:"0_FNAME",content:patient.fullName()},
                        {name:"1_DNAME",content:doctor.getFullName()},
                        {name:"2_DATERDV", content: DateFormat.convertDateObjectToLocal(app.start).format("DD/MM/YYYY")},
                        {name:"3_HOURRDV", content: DateFormat.convertDateObjectToLocal(app.start).format("HH:mm")},
                        {name:"4_ADDRESS", content: secretary.address}
                      ];
                      if (app.source === 'phone') {
                        emailContent.push({name:"5_RATINGURL", content: params.delegatedSecretary.id});
                      }
                      Mailer.sendMail('email-confirmation-rdv-kalendoc',patient.email,emailContent, function() {});
                    }
                  })
                }
              });
            }
          });
        }
      });
    }
  },
  findDoctor: function(req,res){
      // states
      var params = req.allParams();
      RightsManager.setDoctor(req, function(doctor,err){
        if (err) {
          res.json(err.status, {err: err.message});
        } else if (!RightsManager.canAdminDoctor(req.user, doctor)){
          res.json(401,{err:req.__('Error.Rights.Insufficient')})
        } else {
          var request = {};
          if (params.start && params.end) {
            request.start = {
              '>=':moment(params.start).toISOString(),
              '<=':moment(params.end).toISOString()
            };
          }
          async.waterfall([
            function(callback){
              if (params.doctor) {
                callback(params.doctor);
              } else {
                RightsManager.setSecretary(req.user,function(secretary){
                  if(secretary){
                    Doctor.find({
                      secretary: secretary
                    }).exec(function(err,doctors){
                      if (err) {
                        res.json(500, {err:err});
                      } else {
                        callback(_.pluck(doctors,'id'));
                      }
                    });
                  } else {
                    res.json(500, {err: req.__('Error.Intern')});
                  }
                });
              }
            }
            ], function (result){
              request.doctor = result;
              if (params.state) {
                request.state = params.state.split(',');
              }
              Appointment.find(request)
              .populate("doctor")
              .populate("patient")
              .populate("category")
              .limit(150)
              .exec(function(err,doctors){
                if (err) {
                  res.json(400,{err:err});
                } else {
                  res.json(doctors);
                }
              });
            }
          );
        }
      });
    },

  destroy: function(req,res){
    Appointment.destroy(req.param('id')).exec(function(err, apps){
      if (err) {
        res.json(500, {err: err});
      } else {
        res.json(200, apps);
      }
    });
  },

  update: function(req,res) {
    var params = req.allParams();
    // Filtering fields

    delete params.patient;
    delete params.doctor;

    if (params.id) {
      Appointment.findOne(params.id).populate('doctor').exec(function(err,app){
        if (err) {
          res.json(500, {err:err});
        } else if (!app) {
          res.json(404, {err: req.__('Collection.Appointment')+" "+req.__('Error.NotFoud')});
        } else {
          RightsManager.canAdminPatient(req.user, app.patient, function(auth){
            if (!auth) {
              res.json(401, req.__('Error.Rights.Insufficient'));
            } else {
              if ((req.user.secretary || req.user.doctor) && !RightsManager.canAdminDoctor(req.user, app.doctor)) {
                res.json(401, req.__('Error.Rights.Insufficient'));
              } else {
                // start end patient category
                if (params.start || params.end) {
                  params.start = params.start || app.start;
                  params.end = params.end || app.end;
                  params.patient = app.patient;
                  params.category = params.category || app.category;
                  AppointmentServices.validateAppointmentDate(req,params,app.doctor, function(err,params){
                    if (err) {
                      res.json(err.status, {err: err.err});
                    } else {
                      Appointment.update(app.id, params, function(err,app2){
                        if (err) {
                          return res.json(400, {err:err});
                        } else {
                          res.json(app2);
                        }
                      });
                    }
                  });
                } else {
                  Appointment.update(app.id, params, function(err,app2){
                    if (err) {
                      res.json(400, {err:err});
                    } else {
                      res.json(app2);
                    }
                  });
                }
              }
            }
          })
        }
      });
    } else {
      res.json(404, {err: req.__('Error.Fields.Missing')});
    }
  }
});

