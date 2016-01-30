/**
* DelegatedSecretary.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    lastName: {
      type:'string',
      required:true
    },
    firstName: {
      type:'string',
      required:true
    },
    phoneNumber: {
      type:'string',
      required:true
    },
    address: {
      type:'string',
      required:true
    },
    ratings: {
      type:'array',
      defaultsTo: []
    },
    user: {
      model:'User',
      required: true
    },
    handleAppointmentRequest: {
      type: 'boolean',
      defaultsTo: false
    }

  }
};

