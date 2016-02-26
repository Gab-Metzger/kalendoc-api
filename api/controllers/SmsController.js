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
    var from = params.data.sms.from;
    var text = params.data.sms.text;
    Slack.sendSMSMessage("New SMS from " + from + ". Content : " + text);
    return res.json(200, params);
  }
}
