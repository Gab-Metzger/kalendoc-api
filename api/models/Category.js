'use strict';

/**
* Category.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    name:{
      model:'Label',
      required: true
    },
    // Category color. (HTML)
    color:{
      type:'string',
      required:true
    },

    // Cannot be reserved online.
    internal:{
      type:'boolean',
      defaultsTo:false,
      required: true
    },

    // Cannot be reserved at all.

    blocked:{
      type:'boolean',
      defaultsTo:false,
      required: true
    },

    consultingTime:{
      type:'integer',
      required:true,
      enum: sails.config.consultingTimes
    },

    // Each category is own by a doctor.
    doctor:{
      model:'Doctor',
      required:true,
    }
  }
};

