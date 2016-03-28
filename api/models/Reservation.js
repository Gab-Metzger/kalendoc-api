'use strict';

var moment = require('moment');

/**
* Reservation.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  schema: true,

  types: {
    afterStart: function(end){
      return moment(end).isSameOrAfter(this.start);
    },
    sameDay: function(end) {
      return moment(end).isSame(this.start, 'day');
    }
  },

  attributes: {
    weekDay: {
      type: 'integer',
      min: 0,
      max: 6
    },
    start:{
      type: 'datetime',
      required: true,
    },
    end:{
      type: 'datetime',
      required: true,
      afterStart: true,
      sameDay: true
    },
    doctor:{
      model: 'Doctor',
      required: true
    },
    unlimited: {
      type: 'boolean',
      defaultsTo: false,
      required: true
    },
    recurrence: {
      type: 'integer',
      defaultsTo: 1,
      required: true
    },
    duration: {
      type: 'integer'
    },
    sibling: {
      type: 'string'
    },
    isMaster: {
      type: 'boolean',
      defaultsTo: false
    },
    toJSON: function() {
      var obj = this.toObject();
      if (!obj.weekDay) {
        obj.weekDay = moment(obj.start).weekday();
      }
      return obj;
    }
  },

  beforeCreate: function(values, next) {
    values.start = moment(values.start).startOf('minute').toISOString();
    values.end = moment(values.end).startOf('minute').toISOString();
    if(values.unlimited) {
      values.weekDay = moment(values.start).weekday();
      next();
    } else {
      next();
    }
  },
  beforeUpdate: function(values, next){
    Doctor.findOne(values.doctor).exec(function(err,doctor){
      if (doctor) {
        next();
      } else {
        next('Doctor not found.');
      }
    });
  }
};
