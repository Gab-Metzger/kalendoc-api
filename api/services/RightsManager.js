/**
 * RightsManager.js
 * Manage rights for the entire application
 **/

module.exports.canAdminDoctor = function(user,doctor){
  if (!user || !doctor) { // Invalid parameters
    return false;
  }

  if (user.secretary) { // If the user is a secretary
    if (!doctor.secretary ){
      return false;
    } else {
      const secretary = user.secretary.id || user.secretary;
      return doctor.secretary === secretary;
    }
  } else if (user.doctor) { // If the user is a doctor
    if (!doctor.id){
      return false;
    } else {
      const doc = user.doctor.id || user.doctor;
      return doctor.id === doc; // If he is trying to access himself
    }
  } else { // All other cases
    return false;
  }
}

module.exports.canAdminPatient = function(user, patient, callback){
  if (!patient){
    callback(true);
  } else if (!user || !patient ) {
    callback(false);
  } else if (user.doctor || user.secretary || user.delegatedSecretary) {
    callback(true);
  }else {
    Patient.findOne(patient).exec(function(err,patient){
      callback(patient && patient.user == user.id);
    });
  }
}

module.exports.setDoctor = function(req, callback){
  if (! req.user) { // If the user is logged in
    callback(null, {status:401, message: req.__('Error.Rights.Insufficient')});
  } else {
    const doctor_param = req.allParams().doctor || req.user.doctor;
    // If the doctor parameter is not set use the currently logged in doctor if he exists

    if (doctor_param) {
      // If the specified arguments were valid.
      Doctor.findOne(doctor_param).exec(function(err, doctor){
        // Check for doctor existence.
        if (err) {
          callback(null, {status: 500, message: req.__('Error.Intern')});
        } else if (!doctor) {
          callback(null, {status: 400, message: req.__('Collection.Doctor')+' '+req.__('Error.NotFound')});
        } else {
          callback(doctor);
        }
      });
    } else {
      callback(null, {status: 400, message: req.__('Error.Fields.Missing')});
    }
  }
}

module.exports.setSecretary = function(user,callback){
  if(user.secretary){
    callback(user.secretary);
  } else if (user.doctor) {
    Doctor.findOne(user.doctor).exec(function(err,doctor){
      if (doctor) {
        callback(doctor.secretary);
      } else {
        callback(null);
      }
    })
  } else {
    callback(null);
  }
}
