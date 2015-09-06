'use strict';

var _ = require('lodash');
var async = require('async');
var moment = require('moment');

/**
 * ReservationController
 *
 * @description :: Server-side logic for managing Reservations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')),{
  create: function(req,res) {
    RightsManager.setDoctor(req,function(doctor,err){
      if (err) {
        return res.json(err.status, {err: err.message});
      } else {
        if (RightsManager.canAdminDoctor(req.user, doctor)) {
          var params = req.allParams();
          params.start = moment(params.start).hours() * 60 + moment(params.start).minutes();
          params.end = moment(params.end).hours() * 60 + moment(params.end).minutes();
          params.doctor = doctor;
          Reservation.create(params,function(err, reserv){
            if (err) {
              return res.json(400, {err:err});
            } else {
              return res.json(200, {reservation: reserv});
            }
          });
        } else {
          return res.json(401, {err: req.__('Error.Rights.Insufficient')});
        }
      }
    });
  },
  update: function(req,res) {
    var params = req.allParams();
    if (params.id) {
      Reservation.findOne(params.id).populate('doctor').exec(function(err,reserv){
        if (err) {
          res.json(500, {err:err});
        } else if (!reserv) {
          res.json(404, {err: req.__('Collection.Reservation')+" "+req.__('Error.NotFound')});
        } else {
          if (RightsManager.canAdminDoctor(req.user,reserv.doctor)){
            params.doctor = reserv.doctor.id;
            params.start = params.start || reserv.start;
            params.end = params.end || reserv.end;
            params.start = moment(params.start).hours() * 60 + moment(params.start).minutes();
            params.end = moment(params.end).hours() * 60 + moment(params.end).minutes();
            Reservation.update(params.id, params).exec(function(err, reserv){
              if (err) {
                res.json(400, {err:err});
              } else {
                res.json(reserv);
              }
            });
          } else {
            res.json(401, {err: req.__('Error.Rights.Insufficient')});
          }
        }
      })
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  },
  destroy: function(req,res) {
    var params = req.allParams();
    if (params.id) {
      Reservation.findOne(params.id).populate("doctor").exec(function(err,reserv){
        if (err) {
          res.json(500, {err:err});
        } else if (!reserv) {
          res.json(404, req.__('Collection.Reservation')+" "+req.__('Error.NotFound'));
        } else {
          if (RightsManager.canAdminDoctor(req.user, reserv.doctor)){
            Reservation.destroy(params.id).exec(function(err,resrv){
              if (err) {
                res.json(500, {err:err});
              } else {
                res.json(reserv);
              }
            })
          } else {
            res.json(401, {err: req.__('Error.Rights.Insufficient')});
          }
        }
      });
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  },
  find: function(req,res) {
    var query = {};
    const params = req.allParams();
    if (params.doctor) {
      query.doctor = params.doctor;
    }

    if (req.user.doctor) {
      query.doctor = req.user.doctor;
    }
    if (params.start) {
      query.start = params.start;
    }

    if (params.end) {
      query.end = params.end;
    }

    Reservation.find(query).exec(function(err,reservations){
      if (err) {
        res.json(400, {err:err});
      } else {
        res.json(reservations);
      }
    })
  },
  findOne: function(req,res){
    Reservation.findOne(req.params.id).exec(function(err,reservation){
      if (err) {
        res.json(400, {err:err})
      } else if (!reservation){
        res.json(404,{});
      } else {
        res.json(reservation);
      }
    });
  }
});

