'use strict';

/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `config/404.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */
module.exports.routes = {
  // See https://github.com/balderdashy/sails/issues/2062
  'OPTIONS /*': function(req, res) {
    res.send(200);
  },
  'GET /': function(req, res) {
    res.send(200);
  },

  // Authentication routes
  //'/logout': 'AuthController.logout',
  'POST /login': 'AuthController.login',
  'POST /sms/receive': 'SmsController.receive',
  'POST /sms/subscribe': 'SmsController.subscribe',
  'GET /appointment/doctor' : 'AppointmentController.findDoctor',
  'DELETE /appointment/:id' : 'AppointmentController.destroy',
  'GET /secretary/:id/doctors' : 'SecretaryController.findDoctors',
  'GET /secretary/doctors' : 'SecretaryController.findDoctors',
  'GET /category/label/' : 'CategoryController.findLabel',
  'GET /patient/name/' : 'PatientController.findName',
  'GET /patient/:id/mails' : 'MailController.mailsByPatient',
  'GET /doctor/search':'DoctorController.search',
  'GET /doctor':'DoctorController.index',
  'PUT /doctor':'DoctorController.update',
  'GET /mail':'MailController.index',
  'POST /mail':'MailController.create',
  'GET /mail/count':'MailController.count',
  'POST /delegatedSecretary/rate':'DelegatedSecretaryController.rate',
  'GET /voicemail':'Voicemail.index',
  'POST /voicemail':'Voicemail.create',
  'DELETE /voicemail/:id':'Voicemail.destroy',
  'POST /prospect':'Prospect.create'
};
