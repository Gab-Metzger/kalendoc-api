'use strict';

/**
* Appointment.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  type: {
    afterStart: function(end){
      return this.start.getTime() < end.getTime();
    }
  },

  attributes: {
    // Start time
    start:{
      type:'datetime',
      required:true
    },
    // End time
    end:{
      type:'datetime',
      required:true,
      afterStart: true
    },
    // Appointment source
    source:{
      type:'string',
      enum:['internet','phone','doctor'],
      defaultsTo:'doctor'
    },
    // Appointment state
    state:{
      type:'string',
      enum:['accepted','waitingForUserAcceptation','cancelledByUser','blockedByDoctor'],
      defaultsTo:'accepted'
    },
    // Doctor notes
    note:{
      type:'string'
    },
    // Delete token
    acceptToken:{
      type:'string'
    },
    // Did the patient come?
    happened:{
      type:'boolean',
      defaultsTo:false
    },
    sendSMS: {
      type:'boolean',
      defaultsTo: true
    },
    patient: {
      model:'Patient'
    },
    doctor: {
      model:'Doctor',
      required:true,
      index: true
    },
    category:{
      model:'Category'
    },
    toJSON: function(){
      var obj = this.toObject();
      if (obj.patient && obj.patient.lastName && obj.patient.firstName) {
        if (obj.source === 'internet') {
          obj.title = "@ " + obj.patient.lastName + " " + obj.patient.firstName;
        } else {
          obj.title = obj.patient.lastName + " " + obj.patient.firstName;
        }
      } else {
        obj.title = "Bloqué"
      }
      return obj;
    }
  }
};

