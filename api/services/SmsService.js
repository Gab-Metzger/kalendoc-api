/*
 * SmsService.js
 * All the sms logic
 */
var _ = require("lodash");
var moment = require("moment")
var callr = require('callr');


module.exports.reminders = function(onlySms){
  Appointment.find({
    start: {
      ">=" : moment().add(1,"days").startOf("day").format(),
      "<=" : moment().add(1,"days").endOf("day").format()
    },
    patient: {
      "!":null
    },
    state: "accepted"
  }).populate("patient").populate("doctor").exec(function(err,apps){
    if (err) {
      Slack.sendAPIMessage("Error while sending reminders (1): "+err)
    } else {
      _.forEach(apps,function(app){
        User.findOne(app.patient.user).exec(function(err,user){
          if (user) {
            if (onlySms){
              if (user.receiveSMS){
                var message = sails.__({phrase: 'SMS.Reminder.Appointment', locale:'fr'});
                message = message.replace(/{DOCTOR}/g, app.doctor.firstName+" "+app.doctor.lastName);
                message = message.replace(/{DATE}/g, DateFormat.convertDateObjectToLocal(app.start).format("D/M/YYYY"));
                message = message.replace(/{TIME}/g, DateFormat.convertDateObjectToLocal(app.start).format("HH:mm"));
                SmsService.sendSMS(message,user.phone, app.doctor.id);
              }
            } else {
              Secretary.findOne(app.doctor.secretary).exec(function(err,secr){
                if (!secr) {
                  Slack.sendAPIMessage("Error while sending reminders (3): "+err);
                }else {
                  Mailer.sendMail('email-rappel-rdv-kalendoc', user.email,[
                    {name: "0_FNAME", content: app.patient.firstName+" "+app.patient.lastName},
                    {name: "1_DNAME", content: app.doctor.firstName+" "+app.doctor.lastName},
                    {name: "2_DATERDV", content: DateFormat.convertDateObjectToLocal(app.start).format("D/M/YYYY")},
                    {name: "3_HOURRDV", content: DateFormat.convertDateObjectToLocal(app.start).format("HH:mm")},
                    {name: "4_ADDRESS", content: secr.address},
                    {name: "5_CANCELRDV_URL", content: sails.config.appURL+"auth/login"}
                  ],function(){});
                }
              })
            }

          } else {
            Slack.sendAPIMessage("Error while sending reminders (2): Cannot find user for appointment"+app.id+"("+err+")");
          }
        })
      });
    }
  });
}

module.exports.analyzeSMS = function(message, sender){
  var accepted = false;
  var invalid = false;
  var mess = message.toUpperCase()
  mess = mess.replace(/\.|"|,|;|:|\)|!|\r|\n|[|]|BONSOIR|BONJOUR/g," ");
  mess = mess.replace(/0/g,"O");
  mess = mess.replace(/\0|@/g,"");
  mess = mess.replace(/OK/g,"OUI");
  mess = mess.trim();
  mess = mess.split(" ")[0];
  if (mess === "OUI") {
    accepted = true;
  } else if (mess === "NON") {
    accepted = false;
  } else {
    Slack.sendSMSMessage("Sms invalide de "+ sender +": "+message);
    invalid = true;
  }
  User.findOne({phone: sender}).exec(function(err,user){
    if (err){
      invalid = true;
      Slack.sendAPIMessage("Erreur lors de l'analyse du sms (1) (sender:"+sender+",message:"+message+") :"+error);
    } else if (!user) {
      invalid = true;
      Slack.sendSMSMessage("Numéro inconnu : " + sender + ", message: " + message);
    } else {
      SmsService.setAppointmentState(user, accepted);
    }
  });
}

/*
module.exports.sendSMS = function(user, accepted){
  if (!user.smsAppointment) {
    Slack.sendAPIMessage(user.id + " a envoyé un sms de confirmation alors qu'il n'avait pas de RDV ...")
  } else {
    Appointment.findOne(user.smsAppointment).exec(function(err,app){
      if (err) {
        Slack.sendAPIMessage("[SMS CONFIRMATION] Error while getting user appointment"+err)
      } else if (!app) {
        Slack.sendAPIMessage("[SMS CONFIRMATION] Error: cannot find sms appointment of "+ user.id);
      } else {
        if (app.state === "waitingForUserAcceptation"){
          var state;
          if (accepted) {
            state = "accepted"
          } else {
            state = "cancelledByUser";
          }
          Appointment.update(user.smsAppointment,{
            state: state
          }).exec(function(err,app){
            if (err) {
              Slack.sendAPIMessage("[SMS CONFIRMATION] Error: cannot update appointment: "+err);
            }
          })
        }
      }
    });
  }
}*/

module.exports.sendSMS = function(message,receiver, doctor){
  if(doctor) {
    Doctor.findOne(doctor).exec(function(err,doct){
      if (err) {
        Slack.sendAPIMessage("[SMS] Error while sending sms : "+err);
      } else if (!doct) {
        Slack.sendAPIMessage("[SMS] Unable to find doctor when sending sms : "+doctor);
      } else {
        Doctor.update(doctor,{
          smsSent: doct.smsSent+1
        }).exec(function(err,doct){
          if (err) {
            Slack.sendAPIMessage("[SMS] Unable to update doctor sms "+doctor+": "+err);
          }
        })
      }
    });
  }
  if (sails.config.connections.callr.sendSMS) {
    var api = new callr.api(sails.config.connections.callr.user, sails.config.connections.callr.pass);
    var optionSMS = {
      push_mo_enabled: true,
      push_mo_url: sails.config.connections.callr.callback,
    };
    api.call('sms.send', '', receiver, message, null).success(function(response) {
        // success callback
    }).error(function(err){
      Slack.sendStatusMessage("[API] Cannot send sms : "+err);
    });
  } else {
    console.log("[FAKE] Sending SMS to " + receiver + " : " + message)
  }
}

module.exports.sendConfirmations = function(){
  var searchTemplate = {
    patient: {'!': null},
    start: {
      '<=': moment().endOf('year').format(),
      '>=': moment().startOf('year').format()
    },
    state: 'waitingForUserAcceptation'
  }
  Appointment.find(searchTemplate).populate('patient').populate('doctor').exec(function(err,res){
    if (err) {
      Slack.sendAPIMessage('Error while sending sms reminders (1) : '+ err);
    } else {
      const apps = _.uniq(_.map(res,function(n){return {app: n, user: n.patient.user}}),'user');
      _.forEach(apps, function(app){
        User.findOne({id: app.user, receiveSMS:true}).exec(function(err,user){
          if (err) {
            Slack.sendAPIMessage('Error while sending sms reminders (2): ' + err);
          } else if (user) {
            var sms_mess = sails.__({
              phrase: 'SMS.Validate.Appointment',
              locale: 'fr'
            });
            sms_mess = sms_mess.replace(/{DOCTOR}/g, 'Dr.' + app.app.doctor.lastName + ' ' + app.app.doctor.firstName);
            sms_mess = sms_mess.replace(/{DATE}/g, DateFormat.convertDateObjectToLocal(app.app.start).format("D/M/YYYY"));
            sms_mess = sms_mess.replace(/{TIME}/g, DateFormat.convertDateObjectToLocal(app.app.start).format("HH:mm"));

            SmsService.sendSMS(sms_mess, user.phone);
            User.update(user.id, {
              smsAppointment: app.app.id
            }).exec(function(err, user){
              if (err) {
                Slack.sendAPIMessage('Error while sending sms reminders (3): '+err);
              }
            })
          }
        });
      });
    }
  });
}
