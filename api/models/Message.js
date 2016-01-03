/**
* Message.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    senderID: {
      type: 'string',
      required: true
    },
    senderName: {
      type: 'string',
      required: true
    },
    receiverID: {
      type: 'string',
      required: true
    },
    receiverName: {
      type: 'string',
      required: true
    },
    patient: {
      model: 'patient'
    },
    action: {
      type: 'string',
      required: true
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
    },
    previousMessage: {
      model: 'message'
    }
  }
};

