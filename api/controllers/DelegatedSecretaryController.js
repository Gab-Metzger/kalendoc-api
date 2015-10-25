/**
 * DelegatedSecretaryController
 *
 * @description :: Server-side logic for managing Delegatedsecretaries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	rate: function(req, res) {
    var id = req.param('token');
    if (!id) {
      return res.json(401, {err: req.__('Error.Token.Missing')});
    } else {
      DelegatedSecretary.findOne({id: id}, function(err, delegatedSecretary) {
        if (err) {
          console.log(err);
          return res.json(500, err);
        } else if (!delegatedSecretary) {
          return res.json(404, {err: req.__('Error.NotFound')});
        } else {
          delegatedSecretary.ratings.push(JSON.parse(req.param('rating')));
          delegatedSecretary.save(function(err, delegatedSecretary) {
            return res.json(200, delegatedSecretary);
          });
        }
      });
    }
  }
};

