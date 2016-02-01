/**
 * VoicemailController
 *
 * @description :: Server-side logic for managing Voicemails
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var request = require('superagent');
var speech = require('google-speech-api');
var _ = require('lodash');
var opts = {
  filtetype: 'mp3',
  lang: 'fr',
  key: process.env.SPEECH_KEY
}

module.exports = {
  index: function(req, res) {
    if (req.user && req.user.doctor) {
      Voicemail.find({doctor: req.user.doctor, type: 'message'})
      .exec(function(err, voicemails) {
        if (err) {
          console.log(err);
          return res.json(500, {err: err});
        }
        return res.json(200, voicemails);
      });
    } else if (req.user && req.user.secretary) {
      Secretary.findOne(req.user.secretary)
      .populate('doctors')
      .exec(function(err, secretary) {
        var doctorIds = _.map(secretary.doctors, function(item) {
          return item.id
        });
        Voicemail.find({doctor: doctorIds, type: 'message'})
        .exec(function (err, voicemails) {
          if (err) {
            return res.json(404, { err: err });
          }
          return res.json(200, voicemails);
        });
      });
    } else if (req.user.delegatedSecretary) {
      Voicemail.find({type: 'request'})
      .populate('doctor')
      .exec(function (err, voicemails) {
        if (err) {
          console.log(err);
          return res.json(404, { err: err });
        }
        return res.json(200, voicemails);
      });
    }
  },
  create: function(req, res) {
    var params = req.params.all();
    if (params.data.voicemail) {
      if(params.data.raw_digits == sails.config.connections.aircall.requestNumber) {
        var type = 'request';
        DelegatedSecretary.findOne({handleAppointmentRequest: true}).exec(function(err, delegatedSecretary) {
          if (err) {
            console.log(err);
            return res.json(500, {err: err});
          }
          Doctor.findOne({aircallNumber: params.data.raw_digits}).exec(function(err, doctor) {
            if (err) {
              console.log(err);
              return res.json(500, {err: err});
            } else if (!doctor) {
              return res.json(404, {err: "No doctor found !"});
            }
            request
            .get(params.data.voicemail)
            .pipe(speech(opts, function (err, results) {
              if (err) {
                console.log(err);
                Voicemail.create({doctor: doctor.id, url: params.data.voicemail, type: type}).exec(function (err, voicemail) {
                  if (err) {
                    console.log(err);
                    return res.json(500, {err: 'Error on voicemail creation'});
                  } else {
                    sails.sockets.broadcast('delegatedSecretary' + delegatedSecretary.id, 'voicemail', {verb: 'created', data: voicemail});
                    return res.json(200, voicemail);
                  }
                });
              } else if (results[0]) {
                var text = results[0].result[0].alternative[0].transcript;
                Voicemail.create({doctor: doctor.id, url: params.data.voicemail, text: text, type: type}).exec(function (err, voicemail) {
                  if (err) {
                    console.log(err);
                    return res.json(500, {err: 'Error on voicemail creation'});
                  } else {
                    sails.sockets.broadcast('delegatedSecretary' + delegatedSecretary.id, 'voicemail', {verb: 'created', data: voicemail});
                    return res.json(200, voicemail);
                  }
                });
              } else {
                console.log("No transcription result")
                Voicemail.create({doctor: doctor.id, url: params.data.voicemail, type: type}).exec(function (err, voicemail) {
                  if (err) {
                    console.log(err);
                    return res.json(500, {err: 'Error on voicemail creation'});
                  } else {
                    sails.sockets.broadcast('delegatedSecretary' + delegatedSecretary.id, 'voicemail', {verb: 'created', data: voicemail});
                    return res.json(200, voicemail);
                  }
                });
              }
            }));
          });
        });
      } else if (params.data.raw_digits == sails.config.connections.messageNumber) {
        var type = 'message';
        Doctor.findOne({aircallNumber: params.data.raw_digits}).exec(function (err, doctor) {
          if (err) {
            console.log(err);
            return res.json(404, {err: "No doctor found"});
          } else {
            request
            .get(params.data.voicemail)
            .pipe(speech(opts, function (err, results) {
              if (err) {
                console.log(err);
                Voicemail.create({doctor: doctor.id, url: params.data.voicemail}).exec(function (err, voicemail) {
                  if (err) {
                    console.log(err);
                    return res.json(500, {err: 'Error on voicemail creation'});
                  } else {
                    sails.sockets.broadcast('doctor' + doctor.id, 'voicemail', {verb: 'created', data: voicemail});
                    return res.json(200, voicemail);
                  }
                });
              } else if (results[0]) {
                var text = results[0].result[0].alternative[0].transcript;
                Voicemail.create({doctor: doctor.id, url: params.data.voicemail, text: text}).exec(function (err, voicemail) {
                  if (err) {
                    console.log(err);
                    return res.json(500, {err: 'Error on voicemail creation'});
                  } else {
                    sails.sockets.broadcast('doctor' + doctor.id, 'voicemail', {verb: 'created', data: voicemail});
                    return res.json(200, voicemail);
                  }
                });
              } else {
                console.log("No transcription result")
                Voicemail.create({doctor: doctor.id, url: params.data.voicemail}).exec(function (err, voicemail) {
                  if (err) {
                    console.log(err);
                    return res.json(500, {err: 'Error on voicemail creation'});
                  } else {
                    sails.sockets.broadcast('doctor' + doctor.id, 'voicemail', {verb: 'created', data: voicemail});
                    return res.json(200, voicemail);
                  }
                });
              }
            }));
          }
        });
      } else {
        return res.json(401, {err: "Source unknown"});
      }
    } else {
      return res.json(200, {message: "No voicemail, nothing to do."})
    }
  }
};

