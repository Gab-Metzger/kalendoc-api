/**
 * AppointmentServices.js
 * Help the appointment controller
 **/

var moment = require('moment-timezone');
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

module.exports.findWeeklyAppointment = findWeeklyAppointment;

function findWeeklyAppointment(start, doctor, consultingTimeIncrement, callback) {
  var counts = 0;
  var currentDate = moment(start).startOf('day');
  var endOfWeek = moment(start).add(7, 'days').startOf('day');
  var res = [];

  var reservationQuery = {
    where: {
      or: [
        {
          doctor: doctor.id,
          start: {
            '>=': currentDate.toISOString(),
            '<=': endOfWeek.toISOString()
          },
          end: {
            '>=': currentDate.toISOString(),
            '<=': endOfWeek.toISOString()
          },
          unlimited: false
        },
        {
          doctor: doctor.id,
          unlimited: true
        }
      ]
    },
    sort: 'weekDay ASC'
  };

  Reservation.find(reservationQuery).exec(function (err, reservations) {
    if (err) {
      console.log(err);
      return callback(err);
    } else if (reservations.length == 0) {
      console.log("No reservations");
       return callback(res);
    } else {
      Appointment.find({
        doctor: doctor.id,
        start: {
          '>=': currentDate.toISOString(),
          '<=': endOfWeek.toISOString()
        }
      })
      .exec(function (err, appointments) {
        if (err) {
          return callback(err);
        } else {
          var week = _.map(_.fill(Array(7), start), function(n, key) {
            return moment(n).add(key, 'days').toISOString();
          });
          _.each(week, function (day) {
            var currentDayReservations = _.where(reservations, { weekDay: moment(day).weekday() });
            _.each(currentDayReservations, function(reservation) {
              var currentTry = moment(reservation.start);
              var end = moment(reservation.end);
              var currentWeek = moment(day).isoWeek();
              var savedWeek = moment(reservation.start).isoWeek();
              var isAGoodWeek = ((Math.abs(currentWeek - savedWeek) % reservation.recurrence) === 0);
              if (isAGoodWeek) {
                if (reservation.unlimited) {
                  // TODO: Issue when timezone change (summer / winter).
                  // Only the date is changed not the time.
                  var today = moment(day);
                  currentTry.set({year: today.get('year'), month: today.get('month'), date: today.get('date')});
                  end.set({year: today.get('year'), month: today.get('month'), date: today.get('date')});
                }
                var increment = doctor.consultingTime;
                var currentTryFormatted = currentTry.format('DD/MM/YYYY');
                while (currentTry.isBefore(end)) {
                  var beginning = currentTry.clone();
                  var ending = currentTry.clone().add(consultingTimeIncrement, 'minutes');
                  currentTry.add(increment, 'minutes');
                  var appointment = _.find(appointments, function (app) {
                    var mStart = moment(app.start);
                    var mEnd = moment(app.end);
                    return (
                      (mStart.isSameOrBefore(beginning) && !(mEnd.isSameOrBefore(beginning) || mEnd.isAfter(ending)))
                      || (mEnd.isSameOrAfter(ending) && !(mStart.isBefore(beginning) || mStart.isSameOrAfter(ending)))
                      || (mStart.isBetween(beginning, ending) && mEnd.isBetween(beginning, ending))
                      || (mStart.isSameOrBefore(beginning) && mEnd.isSameOrAfter(ending))
                    );
                  });
                  if (!appointment) {
                    if (beginning > moment()) {
                      res.push(beginning.toISOString());
                    }
                  }
                }
              }
            });
          });
          if (res.length == 0) {
            findWeeklyAppointment(currentDate.add(7, 'days').toISOString(), doctor, consultingTimeIncrement, callback);
          } else {
            res = organizeAppointmentsByWeek(res, start);
            return callback(res);
          }
        }
      })
    }
  })
}

function organizeAppointmentsByWeek(appointments, start) {
  var beginning = moment(start).startOf('day');
  var result = [[],[],[],[],[],[],[]];
  _.each(appointments, function(appointment) {
    var currentDate = moment(appointment);
    var index = Math.abs(currentDate.diff(beginning, 'days'));
    result[index].push(appointment);
  });
  _.each(result, function(item) {
    item.sort(sortDateAsc);
  })
  return result;
}

function sortDateAsc(date1, date2) {
  if (new Date(date1) > new Date(date2)) return 1;
  if (new Date(date1) < new Date(date2)) return -1;
  return 0;
}
