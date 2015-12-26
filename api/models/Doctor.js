'use strict';

var _ = require('lodash');

/**
* Doctor.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    // Doctor first name.
    firstName:{
      type:'string',
      required:true
    },
    // Doctor last name.
    lastName:{
      type:'string',
      required:true
    },
    // Gender.
    gender:{
      type:'string',
      enum: ['Mr.','Mme.'],
      required:true
    },
    // Speciality.
    speciality:{
      type:'string',
      required:true
    },
    // Default consulting time.
    consultingTime:{
      type:'integer',
      required: true,
      enum: sails.config.consultingTimes
    },
    picture:{
      type:'string'
    },
    smsAvailable: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    bookingCode: {
      type: 'string',
    },
    access: {
      type: 'string'
    },
    languages:{
      type: 'string'
    },
    description:{
      type: 'string'
    },
    website:{
      type: 'string'
    },
    paymentMethods:{
      type: 'string'
    },
    degrees:{
      type: 'string'
    },
    directives: {
      type: 'string'
    },
    openingHours: {
      type: 'string'
    },

    // allow Message content to be sent by email
    allowCopyEmail: {
      type: 'boolean',
      defaultsTo: false
    },

    // List of all doctor appointements.
    appointements: {
      collection: 'Appointment',
      via: 'doctor'
    },
    // Each categories created by the doctor.
    categories: {
      collection: 'Category',
      via: 'doctor'
    },
    // List of all doctor reservations.
    reservations:{
      collection: 'Reservation',
      via:'doctor'
    },
    // The doctor appointements can be managed by other secretaries.
    delegatedSecretaries:{
      collection:'Secretary',
      via:'delegatedDoctors'
    },
    // Each doctor has a secretary.
    secretary: {
      model:'Secretary',
      required:true
    },
    user: {
      model:'User',
      required: true
    },

    getFullName: function(){
      return `${this.lastName} ${this.firstName}`
    }
  },

  afterCreate: function(doctor, callback){
    User.update(doctor.user, {doctor: doctor.id}).exec(function(err){
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
    Label.findOrCreate({text:"Default"}).exec(function(err,res){
      Category.create({
        name: res.id,
        color:"#1786CC",
        doctor: doctor.id,
        consultingTime: doctor.consultingTime
      }).exec(function(err){
        if (err) {
          callback("Error while creating default category : "+err);
        }
      });
    });
  }
};

