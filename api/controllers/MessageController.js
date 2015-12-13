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
    .exec(function (err, message) {
      if (err) {
        return res.json(500, err);
      }
      sails.sockets.broadcast('doctor' + message.receiver, 'message', {verb: 'created', data: message});
      Message.findOne(message.id).populateAll().exec(function (err, newMessage) {
        if (newMessage.receiver.allowCopyEmail) {
          Doctor.findOne(newMessage.receiver.id).populate('user').exec(function (err, doctor) {
            if (newMessage.patient) {
              if (newMessage.patient.mobilePhone || newMessage.patient.phoneNumber) {
                var emailContent = [
                  {
                    name:"0_DNAME",
                    content: newMessage.receiver.lastName
                  },
                  {
                    name:"1_ONAME",
                    content: String(newMessage.sender.lastName + " " + newMessage.sender.firstName)
                  },
                  {
                    name:"2_PNAME",
                    content: String(newMessage.patient.lastName + " " + newMessage.patient.firstName)
                  },
                  {
                    name:"3_PPHONE",
                    content: newMessage.patient.mobilePhone || newMessage.patient.phoneNumber
                  },
                  {
                    name:"4_CONTENT", content: newMessage.content
                  }
                ];
              } else {
                var emailContent = [
                  {
                    name:"0_DNAME",
                    content: newMessage.receiver.lastName
                  },
                  {
                    name:"1_ONAME",
                    content: String(newMessage.sender.lastName + " " + newMessage.sender.firstName)
                  },
                  {
                    name:"2_PNAME",
                    content: String(newMessage.patient.lastName + " " + newMessage.patient.firstName)
                  },
                  {
                    name:"4_CONTENT", content: newMessage.content
                  }
                ];
              }
            } else {
              var emailContent = [
                {
                  name:"0_DNAME",
                  content: newMessage.receiver.lastName
                },
                {
                  name:"1_ONAME",
                  content: String(newMessage.sender.lastName + " " + newMessage.sender.firstName)
                },
                {
                  name:"4_CONTENT", content: newMessage.content
                }
              ];
            }
            Mailer.sendMail('email-message-kalendoc',doctor.user.email,emailContent, function() {});
          });
        }
      });
      return res.json(200, message);
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
    } else if (req.user && req.user.delegatedSecretary) {
      Message.find(params)
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

