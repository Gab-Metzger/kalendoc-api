/**
 * Mailer.js
 **/
var _ = require("lodash");
var Mandrill = require('machinepack-mandrill');


module.exports.sendMail = function(template, to, mergeVars,callback){
  Mandrill.sendTemplateEmail(_.merge(_.clone(sails.config.connections.mandrillAdapter),{
    templateName: template,
    toEmail: to,
    mergeVars: mergeVars
  })).exec({
    error: function(err){
      console.log("[MAILER] Error while sending "+template+" :" +err);
      console.log(mergeVars);
      Slack.sendAPIMessage("[MAILER] Error while sending "+template+" :" +err);
      callback(err);
    },
    success: function(){
      console.info("[MAILER] "+template+" sent to "+to);
      callback();
    }
  });
}
