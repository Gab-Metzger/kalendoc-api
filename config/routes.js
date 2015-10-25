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

  // Authentication routes
  //'/logout': 'AuthController.logout',
  'POST /login': 'AuthController.login',
  'GET /reset': 'AuthController.sendReset',
  'POST /reset' : 'AuthController.resetPassword',
  'GET /appointment/doctor' : 'AppointmentController.findDoctor',
  'GET /secretary/:id/doctors' : 'SecretaryController.findDoctors',
  'GET /secretary/doctors' : 'SecretaryController.findDoctors',
  'GET /category/label/' : 'CategoryController.findLabel',
  'GET /patient/name/' : 'PatientController.findName',
  'GET /doctor/search':'DoctorController.search',
  'GET /message':'MessageController.index',
  'POST /message':'MessageController.create',
  'GET /message/count':'MessageController.count',
  'POST /delegatedSecretary/rate':'DelegatedSecretaryController.rate'
};
