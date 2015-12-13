/**
* Message.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    sender: {
      model: 'delegatedSecretary',
      required: true
    },
    receiver: {
      model: 'doctor',
      required: true
    },
    patient: {
      model: 'patient'
    },
    content: {
      type: 'string',
      required: true
    },
    read: {
      type: 'boolean',
      defaultsTo: false,
      required: true
    },
    trashed: {
      type: 'boolean',
      defaultsTo: false,
      required: true
    }
  }
};

