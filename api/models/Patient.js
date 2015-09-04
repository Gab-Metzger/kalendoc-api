'use strict';

var phone = require('phone');

/**
* Patient.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  schema: true,

  attributes: {
    // Patient last name
    lastName: {
      type: 'string',
      required: true
    },
    // Patient first name
    firstName: {
      type: 'string',
      required: true
    },
    // Patient email
    email: {
      type: 'string'
    },
    // Patient phone number
    phoneNumber: {
      type: 'string'
    },
    // Patient date of birth
    dateOfBirth: {
      type: 'date'
    },
    // Patient adress
    address: {
      type: 'string'
    },
    // Patient gender
    gender: {
      type:'string',
      enum: ['Mr.','Mme.']
    },

    // A patient can be owend by a user.
    user: {
      model:'User',
    },

    fullName: function(){
      return `${this.lastName} ${this.firstName}`
    }
  },
  beforeCreate: function(values,next){
    if (values.phoneNumber) {
      var p = phone(values.phoneNumber);
      if (!p[0]) {
        next('Invalid phone number'+values.phoneNumber);
      } else {
        next();
      }
    } else {
      next();
    }
  },
  beforeUpdate: function(values, next){
    if (values.phoneNumber) {
      var p = phone(values.phoneNumber);
      if (!p[0]) {
        next('Invalid phone number');
      } else {
        values.phoneNumber = p[0];
        Patient.findOne({
          lastName: values.lastName,
          firstName: values.firstName
        }).exec(function(err,patient){
          if (err || !patient ){
            next();
          } else {
            if (patient.id != values.id) {
              next('This user is already present in database.');
            } else {
              next();
            }
          }
        });
      }
    } else {
      next();
    }
  }
};

