/*
 * Slack.js
 * Slack integration
 */

var Slack = require('slack-node');

module.exports = {
  sendStatusMessage: function(message){
    console.log("[Status] "+message);
    var slack = new Slack();
    slack.setWebhook(sails.config.connections.slack.status);
    slack.webhook({
      channel: "#status",
      username: "KalendocAPI",
      text: message
    }, function(err, response) {
      if (err) {
        console.log("Error while sending slack message : "+err);
      }
    });
  },

  sendSMSMessage: function(message){
    console.log("[SMS] "+message);
    var slack = new Slack();
    slack.setWebhook(sails.config.connections.slack.sms);
    slack.webhook({
      channel: "#sms",
      username: "KalendocAPI",
      text: message
    }, function(err, response) {
      if (err) {
        console.log("Error while sending slack message : "+err);
      }
    });
  },

  sendAPIMessage: function(message){
    console.log("API ERROR : "+message);
    var slack = new Slack();
    slack.setWebhook(sails.config.connections.slack.api);
    slack.webhook({
      channel: "#api-errors",
      username: "KalendocAPI",
      text: message
    }, function(err, response) {
      if (err) {
        console.log("Error while sending slack message : "+err);
      }
    });
  }
}
