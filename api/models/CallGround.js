/**
* Request.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    request: {
      type: 'string',
      required: true
    },
    answer: {
      type: 'string',
      required: true
    },
    doctor: {
      model: 'doctor',
      required: true
    }
  }
};

