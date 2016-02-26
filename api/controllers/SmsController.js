'use strict';

var _ = require('lodash');

/**
 * SMSController
 *
 * @description :: Server-side logic for managing Sms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  receive: function(req,res){
    var params = req.allParams();
    console.log(params);
    Slack.sendAPIMessage("New SMS from ?. Content : ?");
    return res.json(200, params);
  }
}
