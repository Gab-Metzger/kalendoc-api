'use strict';
var callr = require('callr');

/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */
module.exports.bootstrap = function bootstrap(next) {
  /**
   * It's very important to trigger this 'next' method when you are finished with the bootstrap!
   * (otherwise your server will never lift, since it's waiting on the bootstrap)
   */
  if (sails.config.connections.callr.pass) {
    var api = new callr.api(sails.config.connections.callr.user, sails.config.connections.callr.pass);
    var settings = {
        push_mo_enabled: true,
        push_mo_url: sails.config.connections.callr.callback
    };

    api.call('sms.set_settings', settings).success(function(response) {
        console.log("SMS global settings have been defined !");
    });
  }
  next();
};
