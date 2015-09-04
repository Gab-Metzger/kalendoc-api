'use strict';

var _ = require('lodash');

/**
* Secretary.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports ={
  schema:true,

  attributes: {

    name:{
      type:'string',
      required:true
    },
    // Office phone number.
    phone:{
      type:'string',
      required:true
    },
    // Office adress.
    address:{
      type:'string',
      required:true
    },

    // Doctors in this office.
    doctors: {
      collection: 'Doctor',
      via: 'secretary'
    },
    user: {
      model:'User',
      required: true
    },

    delegatedDoctors: {
      collection: 'Doctor',
      via: 'delegatedSecretaries'
    }
  },

  afterCreate: function(secretary, callback){
    User.update(secretary.user, {secretary: secretary.id}).exec(function(err){
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  }
};

