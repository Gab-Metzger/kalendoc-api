/**
 * CityController
 *
 * @description :: Server-side logic for managing cities
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  findByName: function(req, res) {
    var params = req.allParams();
    if (params && params.name) {
      City.find({
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
};

