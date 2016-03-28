'use strict';

var _ = require('lodash');
var moment = require('moment');
var async = require('async');

/**
 * DoctorController
 *
 * @description :: Server-side logic for managing Doctors
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
  findByName: function(req, res) {
    var params = req.allParams();
    if (params && params.name) {
      Doctor.find({
        or: [
          {
            firstName: { 'contains': params.name }
          },
          {
            lastName: { 'contains': params.name }
          }
        ]
      }, function(err, response) {
        if (err) {
        return res.json(404, {err: err});
        } else {
          var doctors = _.map(response, function(doctor) {
            return {
              id: doctor.id,
              fullName: doctor.getFullName()
            };
          });
          return res.json(200, doctors);
        }
      });
    }
  },

  create: function(req,res){
    if (!req.user || !req.user.secretary) {
      return res.json(401,req.__('Error.Rights.Insufficient'));
    }

    var params           = req.allParams();
    const firstName      = params.firstName;
    const lastName       = params.lastName;
    const gender         = params.gender;
    const speciality     = params.speciality;
    const picture        = params.picture;
    const consultingTime = params.consultingTime || Doctor.definition.consultingTime.defaultsTo;
    const languages      = params.languages;
    const activities     = params.activities;
    const website        = params.website;

    // Removing doctor attribures for the user creation.
    delete params.firstName;
    delete params.lastName;
    delete params.gender;
    delete params.speciality;
    delete params.consultingTime;
    delete params.languages;
    delete params.activities;
    delete params.website;
    delete params.smsSent;

    User.create(params,function(err, user) {
      if (err) {
        res.json(400,{err: err});
      } else {
        Doctor.create({
          firstName: firstName,
          lastName: lastName,
          gender: gender,
          speciality: speciality,
          consultingTime: consultingTime,
          user: user,
          secretary: req.user.secretary,
          picture: picture,
          languages: languages,
          activities: activities,
          website: website
        }, function(err,doctor){
          if (err) { // If there is an error during doctor creation
            if (user.id) { // Can be removed but want to be sure because if user.id == null he will destroy all users
              User.destroy(user.id,function(){ // Delete the user
                res.json(400,{err: err});
              });
            } else {
              res.json(400,{err: err});
            }
          } else {
            res.json({doctor: doctor});
          } // Doctor Creation OK
        }); // Doctor Create
      } // User Creation OK
    }); // User Create
  },

  search: function(req,res) {
    var startTimer = new Date().getTime();
    var params = req.allParams();
    if (!params.name && !params.speciality && !params.city){
      res.json(400, {err: req.__('Error.Fields.Missing')});
    } else if (! params.start || ! moment(params.start).isValid()) {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    } else {
      var query = {};
      if (params.name) {
        var names = params.name.split(' ');
        query = {lastName: names[0], firstName: names[1]};
      }

      Doctor.find(query)
      .populate("secretary")
      .populate("callGrounds")
      .exec(function(err,doctors){
        if (err) {
          res.json(400, {err:err});
        } else {
          if (params.speciality){
            doctors = _.filter(doctors,
              function(doctor) {
                return doctor.speciality == params.speciality;
              }
            );
          }
          if (params.city){
            doctors = _.filter(doctors,
              function(doctor) {
                if (doctor.secretary) {
                  var address = doctor.secretary.address;
                } else {
                  var address = doctor.address;
                }
                const foundPosition = address.toUpperCase().lastIndexOf(params.city.toUpperCase());
                const expectedPosition = address.length - params.city.length;
                return foundPosition ==  expectedPosition;
              }
            );
          }
          const results = [];
          async.each(doctors,
            function(doctor,cb){
              var consultingTimeParams = params.consultingTime || doctor.consultingTime;
              AppointmentServices.findWeeklyAppointment(params.start, doctor, consultingTimeParams, function(res){
                doctor.appointments = res;
                results.push(doctor);
                cb();
              })
            },
            function(done){
              var endTimer = new Date().getTime();
              res.json(results);
              console.log("It took " + (endTimer - startTimer) + " milliseconds to search for free appointments");
            }
          )
        }
      });
    }
  },

  update: function(req,res){
    var params = req.allParams();
    delete params.smsSent;
    delete params.user;
    if (params.id) {
      Doctor.findOne(params.id).exec(function(err,doctor){
        if (err) {
          res.json(500, {err: req.__('Error.Intern')});
        } else if (!doctor) {
          res.json(404, {err: req.__('Collection.Doctor') + " " + req.__('Error.NotFound')});
        } else {
          if (! RightsManager.canAdminDoctor(req.user, doctor)) {
            res.json(401, {err: req.__('Error.Rights.Insufficient')})
          } else {
            Doctor.update(params.id, params).exec(function(err,doc){
              if (err) {
                res.json(400, {err:err});
              } else {
                res.json(doc);
              }
            });
          }
        }
      });
    } else {
      res.json(404, {err: req.__('Error.Fields.Missing')})
    }
  }
});
