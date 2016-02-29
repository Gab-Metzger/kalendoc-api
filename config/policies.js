'use strict';

/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.policies.html
 */
module.exports.policies = {
  // Default policy for all controllers and actions
  '*': false,
  AuthController: {
    '*': true
  },
  
  SmsController: {
    '*': true
  },

  UserController: {
    'create': true,
    'update': ['loggedIn'],
    'findOne': ['loggedIn'],
    'forgot': true,
    'reset': true
  },

  SecretaryController: {
    'create': ['loggedIn'],
    'update': ['loggedIn','secretary'],
    'find' : ['loggedIn','medicalPro'],
    'findOne' : ['loggedIn', 'medicalPro'],
    'findDoctors' : ['loggedIn', 'medicalPro']
  },

  DelegatedSecretaryController: {
    'rate': true
  },

  DoctorController: {
    'findByName': true,
    'create': ['loggedIn', 'secretary'],
    'update': ['loggedIn', 'medicalPro'],
    'findOne': ['loggedIn', 'medicalPro'],
    'search': true
  },

  CategoryController: {
    'create': ['loggedIn','medicalPro'],
    'find': true,
    'findLabel': true,
    'update': ['loggedIn', 'medicalPro'],
    'destroy': ['loggedIn', 'medicalPro']
  },

  ReservationController: {
    'create': ['loggedIn','medicalPro'],
    'find': ['loggedIn'],
    'findOne' : ['loggedIn'],
    'update' : ['loggedIn', 'medicalPro'],
    'destroy' : ['loggedIn', 'medicalPro']
  },

  AppointmentController: {
    'subscribe': true,
    'create': true,
    'findDoctor' : ['loggedIn','medicalPro'],
    'destroy': ['loggedIn'],
    'update' : ['loggedIn']
  },
  PatientController: {
    'create': true,
    'find' : ['loggedIn', 'medicalPro'],
    'findOne': ['loggedIn', 'medicalPro'],
    'findName' : ['loggedIn','medicalPro'],
    'findAppointments': ['loggedIn'],
    'update' : ['loggedIn']
  },
  SpecialityController: {
    'findByName': true
  },
  CityController: {
    'findByName': true
  },
  MailController: {
    '*': ['loggedIn', 'medicalPro']
  },
  VoicemailController: {
    'index': ['loggedIn', 'medicalPro'],
    'create': true,
    'destroy': ['loggedIn', 'medicalPro']
  }
};
