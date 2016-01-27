/**
 * VoicemailController
 *
 * @description :: Server-side logic for managing Voicemails
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	create: function(req, res) {
    var params = req.params.all();
    console.log("AIRCALL PARAMS");
    console.log(params);
    return res.json(200, params);
    //TODO: Find link between aircall object and doctor
    // Doctor.findOne({lastName: params.lastName}).exec(function (err, doctor) {
    //   if (err) {
    //     console.log(err);
    //     return res.json(404, {err: "No doctor found"});
    //   } else {
    //     Voicemail.create({doctor: doctor.id, url: params.url}).exec(function (err, voicemail) {
    //       if (err) {
    //         console.log(err);
    //         return res.json(500, {err: 'Error on voicemail creation'});
    //       } else {
    //         return res.json(200, voicemail);
    //       }
    //     });
    //   }
    // });
  }
};

