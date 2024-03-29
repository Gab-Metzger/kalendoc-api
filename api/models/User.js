'use strict';

var _ = require('lodash');
var bcrypt = require('bcrypt');
var phone = require('phone');

/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
 module.exports = {
  attributes: {
    // User email : required for login
    email: {
      type: 'email',
      unique: true,
      required: true
    },
    // User phone number
    phone: {
      type: 'string'
    },
    password: {
      type: 'string',
      required: true
    },

    acceptTOU: {
      type: 'boolean',
      defaultsTo: false,
      required: true
    },
    // User reset token : Used for password recovery
    resetPasswordToken: {
      type: 'string'
    },
    // User reset time : Used for password recovery
    resetPasswordExpires: {
      type: 'datetime'
    },
    // Should the user receive appointements notifications
    receiveBroadcast:{
      type:'boolean',
      defaultsTo:'true'
    },
    // Should the user receive SMS
    receiveSMS:{
      type:'boolean',
      defaultsTo:'true'
    },
    // Below is all specification for relations to another models
    // Logs related to the user
    requestLogs: {
      collection: 'RequestLog',
      via: 'user'
    },

    secretary: {
      model:'Secretary'
    },

    doctor: {
      model:'Doctor'
    },

    patient: {
      model:'Patient'
    },

    delegatedSecretary: {
      model: 'DelegatedSecretary'
    },

    smsAppointment: {
      model: 'appointment'
    },
    // Custom methods
    toJSON: function(){
      var obj = this.toObject();
      delete obj.password;
      return obj;
    },

    comparePassword: function(password, callback) {
      bcrypt.compare(password, this.password, function(err,match){
        if (err) {
          callback(err);
        } else {
          if (match) {
            callback(null,true);
          } else {
            callback(null,false);
          }
        }
      });
    }
  },
  beforeCreate : function(values, callback) {
    User.findOne({email: values.email})
    .exec(function (err, user) {
      if (err) {
        return callback(err);
      } else if (user) {
        return callback({message: "Adresse email déjà utilisée."})
      } else {
        if (values.secretary || values.doctor){
          values.receiveSMS = false;
          values.receiveBroadcast = false;
        }
        bcrypt.genSalt(14, function(err,salt){
          if (err) {
            return callback(err);
          }
          bcrypt.hash(values.password, salt, function(err,hash){
            if (err) {
              return callback(err);
            }
            values.password = hash;
            callback();
          })
        });
      }
    })
  },
  beforeUpdate: function(values, callback) {
    if (values.secretary || values.doctor){
      values.receiveSMS = false;
      values.receiveBroadcast = false;
    }
    if (values.phone){
      var p = phone(values.phone)
      if (! p[0]){
        return callback('Invalid phone number')
      } else {
        values.phone = p[0]
      }
    }
    if (values.password) {
      bcrypt.genSalt(14, function(err,salt){
        if (err) {
          return callback(err);
        }
        bcrypt.hash(values.password, salt, function(err,hash){
          if (err) {
            return callback(err);
          }
          values.password = hash;
          return callback();
        })
      });
    } else {
      return callback();
    }
  }
};
