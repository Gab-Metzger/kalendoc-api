/**
 * AppointmentServices.js
 * Help the appointment controller
 **/

var moment = require('moment');
var async = require("async");
var _ = require('lodash');

module.exports.validateAppointmentDate = function(req, params, doctor, callback){
  if (params.start && params.end){
    const start = new Date(params.start);
    const end = new Date(params.end);
    // Si la date est invalide.
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      callback({status:400, err:req.__('Error.Fields.Date.Invalid')});
    } else {
      const deltaT = end.getTime() - start.getTime();
      const consultingTime = doctor.consultingTime*60*1000;
      if (deltaT >= 86400000 || start.getDay() != end.getDay()){ // Si le debut et la fin ne sont pas sur la même journée.
                  // ^=24*60*60*1000 : Une journée en millisecondes
        callback({status:400,err:req.__('Error.Validate.NotSameDay')});
      } else {
        if (params.state == 'blockedByDoctor' && (req.user.doctor || req.user.secretary)){
          callback(null,params);
        } else {
          const start_time = start.getUTCHours()*60 + start.getMinutes();
          const end_time   = end.getUTCHours()*60 + end.getMinutes();
          Reservation.findOne({
            weekDay: start.getDay(),
            start:   {'<=': start_time},
            end:     {'>=': end_time},
            doctor:  doctor.id
          }).exec(function(err,reservation){
            if (err) {
              callback({status:500,err:err});
            } else {
              if (! reservation && !req.user.doctor && !req.user.secretary) {
                callback({status:400,err: req.__('Error.Validate.CannotReserve')});
              } else {
                if (!req.user.doctor && !req.user.secretary){
                  params.category = reservation.category;
                }
                Category.findOne(params.category).exec(function(err,cat){
                  if (err) {
                    callback({status: 500, err:err})
                  } else if (!cat){
                    callback({status: 400, err:req.__('Collection.Category')+" "+req.__('Error.NotFound')});
                  } else {
                    const consultingTime = cat.consultingTime * 60 * 1000;
                    const doctorOk = (req.user.secretary || req.user.doctor) && consultingTime %deltaT == 0;
                    const userOk = (! (req.user.secretary || req.user.doctor)) && consultingTime == deltaT;
                    if (doctorOk || userOk) {
                      Appointment.findOne({
                        start: {'<=': start},
                        end:   {'>=': end},
                        or: [
                          { doctor: doctor.id },
                          { patient: params.patient}
                        ]
                      }).exec(function(err,app){
                        if (app && !req.user.doctor && ! req.user.secretary) {
                          callback({status:400, err: req.__('Error.Validate.CannotReserve')});
                        } else {
                          callback(null,params);
                        }
                      });
                    } else {
                      callback({status:400, err: req.__('Error.Validate.ConsultingTime')});
                    }
                  }
                });
              }
            }
          });
        }
      }
    }
  } else {
    callback({status:400, err: req.__('Error.Fields.Missing')});
  }
}

module.exports.findFiveFirstAppointments = function(start, doctor, callback) {
  var counts = 0;
  var currentDate = moment(start).startOf('day');
  var endOfWeek = moment(start).add(6, 'days');
  var res = [];

  Reservation.findOne({doctor:doctor.id}).exec(function(err,doctorReservations){
    if (!doctorReservations) {
      callback(res);
    } else {
      async.whilst(
        function() {
          return currentDate < endOfWeek
        },
        function(cb) {
          res[counts] = [];
          Reservation.find({
            where: {
              weekDay: currentDate.day(),
              doctor: doctor.id
            },
            sort: 'start'
          }).exec(function(err, reservations){
            if (err) {
              console.log("Error on getting reservations: "+err);
            }
            async.forEachSeries(reservations,
              function(reservation, cb){
                var currentTry = moment(currentDate).startOf('day').add(reservation.start,'minutes');
                var end = moment(currentDate).startOf('day').add(reservation.end,'minutes');
                var increment = doctor.consultingTime;
                var currentTryFormatted = currentTry.format('DD/MM/YYYY');

                async.whilst(
                  function(){
                    return currentTry.isBefore(end);
                  },
                  function(cb){
                    Appointment.findOne({
                      doctor: doctor.id,
                      start: {'<=': currentTry.toISOString()},
                      end: {'>=':currentTry.toISOString()}
                    }).exec(function(err,app){
                      if (err) {
                        console.log("Error on getting reservations (1): "+err);
                      }
                      if (!app) {
                        res[counts].push(currentTry.toISOString());
                      }
                      currentTry = currentTry.add(increment,'minutes');
                      cb();
                    });
                  },
                  function(err){
                    cb();
                  }
                );
              },
              // When it's done !
              function(err){
                counts++;
                currentDate = currentDate.add(1,'day');
                cb();
              }
            );
          })
        },
        function(err){
          callback(res);
        }
      );
    }
  });
}
