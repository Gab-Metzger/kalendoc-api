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
      sails.sockets.join(req.socket, 'delegatedSecretary' + req.param('data'));
      console.log("DelegatedSecretary subscribe to " + req.socket.id);
    }
  },

  create: function(req, res) {
    var params = req.allParams();
    Message.create(params)
    .exec(function (err, message) {
      if (err) {
        return res.json(500, err);
      }
      sails.sockets.broadcast('doctor' + message.receiverID, 'message', {verb: 'created', data: message});
      sails.sockets.broadcast('delegatedSecretary' + message.receiverID, 'message', {verb: 'created', data: message});
      Message.findOne(message.id).populateAll().exec(function (err, newMessage) {
        Doctor.findOne(message.receiverID).populate('user').exec(function(err, doctor) {
          if (doctor && doctor.allowCopyEmail) {
            if (newMessage.patient) {
              if (newMessage.patient.mobilePhone || newMessage.patient.phoneNumber) {
                var emailContent = [
                  {
                    name:"0_DNAME",
                    content: newMessage.receiverName
                  },
                  {
                    name:"1_ONAME",
                    content: newMessage.senderName
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
                  },
                  {
                    name:"5_ACTION", content: newMessage.action
                  }
                ];
              } else {
                var emailContent = [
                  {
                    name:"0_DNAME",
                    content: newMessage.receiverName
                  },
                  {
                    name:"1_ONAME",
                    content: newMessage.senderName
                  },
                  {
                    name:"2_PNAME",
                    content: String(newMessage.patient.lastName + " " + newMessage.patient.firstName)
                  },
                  {
                    name:"4_CONTENT", content: newMessage.content
                  },
                  {
                    name:"5_ACTION", content: newMessage.action
                  }
                ];
              }
            } else {
              var emailContent = [
                {
                  name:"0_DNAME",
                  content: newMessage.receiverName
                },
                {
                  name:"1_ONAME",
                  content: newMessage.senderName
                },
                {
                  name:"4_CONTENT", content: newMessage.content
                },
                {
                  name:"5_ACTION", content: newMessage.action
                }
              ];
            }
            Mailer.sendMail('email-message-kalendoc',doctor.user.email,emailContent, function() {});
          }
        });
      });
      return res.json(200, message);
    })
  },

  index: function(req, res) {
    var params = req.allParams();
    if(req.user && req.user.doctor) {
      params.receiverID = req.user.doctor;
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
        params.receiverID = doctorIds;
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
      params.receiverID = req.user.delegatedSecretary;
      Message.find(params)
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

  allMessageForOnePatient: function(req, res) {
    var params = req.allParams();
    Message.find({receiverID: params.receiverID, patient: params.patient})
    .exec(function(err, messages) {
      if (err) {
        console.log(err);
        return res.json(500, {err: err});
      }
      else {
        return res.json(200, messages);
      }
    });
  },

  count: function (req, res) {
    if(req.user && req.user.doctor) {
      Message.count({receiverID: req.user.doctor, read: false, trashed: false})
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
        Message.count({receiverID: doctorIds, read: false, trashed: false})
        .exec(function (err, count) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, { count: count });
        });
      })
    } else if (req.user && req.user.delegatedSecretary) {
      Message.count({receiverID: req.user.delegatedSecretary, read: false, trashed: false})
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
      Message.destroy({receiverID: req.user.doctor, trashed: true})
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
        Message.destroy({receiverID: doctorIds, trashed: true})
        .exec(function (err, deletedMails) {
          if(err) {
            return res.json(404, { err: err });
          }
          return res.json(200, deletedMails);
        });
      })
    } else if (req.user && req.user.delegatedSecretary) {
        Message.destroy({receiverID: req.user.delegatedSecretary, trashed: true})
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

