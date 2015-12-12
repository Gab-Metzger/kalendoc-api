/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var _ = require('lodash');

module.exports = {
  subscribe: function(req, res) {
    if (req.isSocket) {
      Message.watch(req.socket);
      console.log("Doctor or Secretary subscribe to " + req.socket.id);
    }
  },

  create: function(req, res) {
    var params = req.allParams();
    Message.create(params)
    .populateAll()
    .exec(function (err, newMessage) {
      if (err) {
        return res.json(500, err);
      }
      sails.sockets.broadcast('doctor' + newMessage.receiver, 'message', {verb: 'created', data: newMessage});
      return res.json(200, newMessage);
    })
  },

  index: function(req, res) {
    var params = req.allParams();
    if(req.user && req.user.doctor) {
      params.receiver = req.user.doctor;
      Message.find(params)
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
        params.receiver = doctorIds;
        Message.find(params)
        .populateAll()
        .exec(function (err, messages) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(messages);
        });
      })
    } else {
      return res.json(400, { err: req.__('Error.Fields.Missing')});
    }
  },

  count: function (req, res) {
    if(req.user && req.user.doctor) {
      Message.count({receiver: req.user.doctor, read: false, trashed: false})
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
        Message.count({receiver: doctorIds, read: false, trashed: false})
        .exec(function (err, count) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, { count: count });
        });
      })
    } else {
      return res.json(400, { err: req.__('Error.Fields.Missing')});
    }
  },

  emptyTrash: function (req, res) {
    if(req.user && req.user.doctor) {
      Message.destroy({receiver: req.user.doctor, trashed: true})
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
        Message.destroy({receiver: doctorIds, trashed: true})
        .exec(function (err, deletedMails) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, deletedMails);
        });
      })
    } else {
      return res.json(400, { err: req.__('Error.Fields.Missing')});
    }
  },
};

