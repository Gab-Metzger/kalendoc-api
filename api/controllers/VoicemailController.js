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
      Voicemail.find({doctor: req.user.doctor})
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
        Voicemail.find({doctor: doctorIds})
        .exec(function (err, voicemails) {
          if (err) {
            return res.json(404, { err: err });
          }
          return res.json(200, voicemails);
        });
      });
    } else if (req.user.delegatedSecretary) {
      Voicemail.find({doctor: {$exists: false}})
      .exec(function (err, voicemails) {
        if (err) {
          return res.json(404, { err: err });
        }
        return res.json(200, voicemails);
      });
    }
  },
	create: function(req, res) {
    var params = req.params.all();
    if (params.data.voicemail) {
      Doctor.findOne({aircallNumber: params.data.number.digits}).exec(function (err, doctor) {
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
                  return res.json(200, voicemail);
                }
              });
            } else if (results[0]) {
              var text = results[0].result[0].alternative[0].transcript;
              console.log(text);
              Voicemail.create({doctor: doctor.id, url: params.data.voicemail, text: text}).exec(function (err, voicemail) {
                if (err) {
                  console.log(err);
                  return res.json(500, {err: 'Error on voicemail creation'});
                } else {
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
                  return res.json(200, voicemail);
                }
              });
            }
          }));
        }
      });
    } else {
      return res.json(200, {message: "No voicemail, nothing to do."})
    }
  }
};

