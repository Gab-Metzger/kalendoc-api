'use strict';

var moment = require('moment');

/**
* Reservation.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  schema:true,
  types: {
    afterStart: function(end){
      return this.start < end;
    }
  },
  attributes: {
    weekDay:{
      type:'integer',
      required:true,
      min:0,
      max:6
    },
    start:{
      type:'integer',
      min:0,
      max:3599,
      required:true,
    },
    end:{
      type:'integer',
      required:true,
      min:0,
      max:3599,
      afterStart:true
    },

    doctor:{
      model:'Doctor',
      required:true
    },
    toJSON: function(){
      var obj = this.toObject();
      obj.start = moment().startOf('day').add(obj.start,'minutes').utcOffset(0).toISOString();
      obj.end = moment().startOf('day').add(obj.end,'minutes').utcOffset(0).toISOString();
      return obj;
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

