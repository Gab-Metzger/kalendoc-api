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
    mobilePhone: {
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
    // user: {
    //   model:'User',
    // },

    fullName: function(){
      return `${this.lastName} ${this.firstName}`
    }
  },
  beforeCreate: function(values,next){
    if (values.mobilePhone) {
      var p = phone(values.mobilePhone);
      if (!p[0]) {
        next('Invalid phone number'+values.mobilePhone);
      } else {
        next();
      }
    } else {
      next();
    }
  },
  beforeUpdate: function(values, next){
    if (values.mobilePhone) {
      var p = phone(values.mobilePhone);
      if (!p[0]) {
        next('Invalid phone number'+values.mobilePhone);
      } else {
        next();
      }
    } else {
      next();
    }
  }
};

