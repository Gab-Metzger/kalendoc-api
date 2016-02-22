/**
 * MailController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var _ = require('lodash');

module.exports = {
  subscribe: function(req, res) {
    if (req.isSocket) {
      sails.sockets.join(req.socket, 'delegatedSecretary' + req.param('data'));
      console.log("DelegatedSecretary subscribe to " + req.socket.id);
    }
  },

  create: function(req, res) {
    MailService.create(req, function(err, mail) {
      if (err) {
        return res.json(500, err);
      } else {
        return res.json(200, mail);
      }
    });
  },

  index: function(req, res) {
    var params = req.allParams();
    if(req.user && req.user.doctor) {
      params.receiverID = req.user.doctor;
      Mail.find(params)
      .populateAll()
      .exec(function (err, messages) {
        if(err) {
          return res.json(404, { err: err });
        }
        return res.json(messages);
      });
    } else if (req.user && req.user.secretary) {
      Secretary.findOne(req.user.secretary)
      .populate('doctors')
      .exec(function(err, secretary) {
        var doctorIds = _.map(secretary.doctors, function(item) {
          return item.id
        });
        params.receiverID = doctorIds;
        Mail.find(params)
        .populateAll()
        .exec(function (err, messages) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(messages);
        });
      })
    } else if (req.user && req.user.delegatedSecretary) {
      params.receiverID = req.user.delegatedSecretary;
      Mail.find(params)
      .populateAll()
      .exec(function (err, messages) {
        if(err) {
          return res.json(404, { err: err });
        }
        return res.json(messages);
      });
    } else {
      return res.json(400, { err: req.__('Error.Fields.Missing')});
    }
  },

  mailsByPatient: function(req, res) {
    var params = req.allParams();
    Mail.find({patient: params.id})
    .exec(function(err, mails) {
      if (err) {
        console.log(err);
        return res.json(500, {err: err});
      }
      else {
        return res.json(200, mails);
      }
    });
  },

  count: function (req, res) {
    if(req.user && req.user.doctor) {
      Mail.count({receiverID: req.user.doctor, read: false, trashed: false})
      .exec(function (err, count) {
        if(err) {
          return res.json(404, { err: err });
        }
        return res.json(200, { count: count });
      });
    } else if (req.user && req.user.secretary) {
      Secretary.findOne(req.user.secretary)
      .populate('doctors')
      .exec(function (err, secretary) {
        var doctorIds = _.map(secretary.doctors, function(item) {
          return item.id
        });
        Mail.count({receiverID: doctorIds, read: false, trashed: false})
        .exec(function (err, count) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, { count: count });
        });
      })
    } else if (req.user && req.user.delegatedSecretary) {
      Mail.count({receiverID: req.user.delegatedSecretary, read: false, trashed: false})
      .exec(function (err, count) {
        if(err) {
          return res.json(404, { err: err });
        }
        return res.json(200, { count: count });
      });
    } else {
      return res.json(400, { err: req.__('Error.Fields.Missing')});
    }
  },

  emptyTrash: function (req, res) {
    if(req.user && req.user.doctor) {
      Mail.destroy({receiverID: req.user.doctor, trashed: true})
      .exec(function (err, deletedMails) {
        if(err) {
          return res.json(404, { err: err });
        }
        return res.json(200, deletedMails);
      });
    } else if (req.user && req.user.secretary) {
      Secretary.findOne(req.user.secretary)
      .populate('doctors')
      .exec(function(err, secretary) {
        var doctorIds = _.map(secretary.doctors, function(item) {
          return item.id
        });
        Mail.destroy({receiverID: doctorIds, trashed: true})
        .exec(function (err, deletedMails) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, deletedMails);
        });
      })
    } else if (req.user && req.user.delegatedSecretary) {
        Mail.destroy({receiverID: req.user.delegatedSecretary, trashed: true})
        .exec(function (err, deletedMails) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, deletedMails);
        });
    } else {
      return res.json(400, { err: req.__('Error.Fields.Missing')});
    }
  },
};

