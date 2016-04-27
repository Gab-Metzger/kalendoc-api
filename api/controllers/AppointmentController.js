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
      _.forEach(req.param('data'), function(item) {
        sails.sockets.join(req.socket, 'doctor' + item);
      })
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
          Appointment.findOne(app.id).populateAll().exec(function(err,app){
            var doctor = app.doctor;
            // sails.sockets.broadcast('doctor'+doctor.id, 'appointment', {
            //   verb: 'created',
            //   data: app
            // });
            sails.sockets.broadcast('doctor'+doctor.id, 'appointment', app, req);
            res.json(200,{appointment:app});
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

                      var emailContent = {
                        "firstName":patient.fullName(),
                        "docName":doctor.getFullName(),
                        "heureRDV": DateFormat.convertDateObjectToLocal(app.start).format("HH:mm"),
                        "dateRDV":DateFormat.convertDateObjectToLocal(app.start).format("DD/MM/YYYY"),
                        "adrsRDV":secretary.address
                      };
                      if (app.source === 'phone') {
                        emailContent["opName"]=params.delegatedSecretary.firstName;
                      }

                      Mailer.sendMail('email-confirmation',patient.email,emailContent);
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
              .sort({start: 1})
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
    var previous = params;

    delete params.patient;
    delete params.doctor;

    Appointment.update(params.id, params, function(err, app){
      if (err) {
        console.log(err);
        return res.json(500, {err:err});
      } else {
        // sails.sockets.broadcast('doctor'+app[0].doctor, 'appointment', {
        //   verb: 'updated',
        //   previous: previous,
        //   new: app
        // });
        return res.json(200, app);
      }
    });
  }
});

