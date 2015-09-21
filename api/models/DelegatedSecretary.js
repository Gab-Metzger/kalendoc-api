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
    like: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    dislike: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    user: {
      model:'User',
      required: true
    }

  }
};

