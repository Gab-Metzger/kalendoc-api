'use strict';

var _ = require('lodash');

/**
 * SpecialityController
 *
 * @description :: Server-side logic for managing specialities
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  findByName: function(req, res) {
    var params = req.allParams();
    if (params && params.name) {
      Speciality.find({
        name: {"contains": params.name}
      }, function(err, response) {
        if (err) {
        return res.json(404, {err: err});
        } else {
          return res.json(200, response);
        }
      });
    }
  }
}
