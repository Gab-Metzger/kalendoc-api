/**
 * VoicemailController
 *
 * @description :: Server-side logic for managing Voicemails
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	create: function(req, res) {
    var params = req.params.all();
    Doctor.findOne({aircallNumber: params.data.number.digits}).exec(function (err, doctor) {
      if (err) {
        console.log(err);
        return res.json(404, {err: "No doctor found"});
      } else {
        Voicemail.create({doctor: doctor.id, url: params.data.voicemail}).exec(function (err, voicemail) {
          if (err) {
            console.log(err);
            return res.json(500, {err: 'Error on voicemail creation'});
          } else {
            return res.json(200, voicemail);
          }
        });
      }
    });
  }
};

