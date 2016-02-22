module.exports = {
  create: function(req, callback) {
    var params = req.allParams();
    Mail.create(params)
    .exec(function(err, mail) {
      if (err) {
        callback(err, null);
        return false;
      } else {
        broadcastNewMail(mail);
        sendCopyEmail(mail);
        callback(null, mail);
        return true;
      }
    });
  },

  update: function(req, callback) {
    var params = req.params.all();
    Mail.update(params)
    .exec(function(err, mail) {
      if (err) {
        callback(err, null);
        return false;
      } else {
        callback(null, mail);
        return true;
      }
    });
  },

  destroy: function(req, callback) {
    var params = req.params.all();
    Mail.destroy(params)
    .exec(function(err, mail) {
      if (err) {
        callback(err, null);
        return false;
      } else {
        callback(null, mail);
        return true;
      }
    });
  },
}

function broadcastNewMail(mail) {
  if (mail.receiverRole === 'doctor') {
    sails.sockets.broadcast('doctor' + mail.receiverID, 'mail', {
      verb: 'created',
      data: mail
    });
  } else if (mail.receiverRole === 'operator') {
    sails.sockets.broadcast('delegatedSecretary' + mail.receiverID, 'mail', {
      verb: 'created',
      data: mail
    });
  }
}

function sendCopyEmail(mail) {
  Mail.findOne(mail.id)
  .populateAll()
  .exec(function (err, mail) {
    Doctor.findOne(mail.receiverID).populate('user').exec(function(err, doctor) {
      if (doctor && doctor.allowCopyEmail) {
        var emailContent = [
          {
            name:"0_DNAME",
            content: mail.receiverName
          },
          {
            name:"1_ONAME",
            content: mail.senderName
          },
          {
            name:"4_CONTENT", content: mail.content
          },
          {
            name:"5_ACTION", content: mail.action
          }
        ];
        if (mail.patient) {
          if (mail.patient.mobilePhone || mail.patient.phoneNumber) {
            emailContent.push(
              {
                name:"2_PNAME",
                content: String(mail.patient.lastName + " " + mail.patient.firstName)
              }
            );
            emailContent.push(
              {
                name:"3_PPHONE",
                content: mail.patient.mobilePhone || mail.patient.phoneNumber
              }
            );
          } else {
            emailContent.push(
              {
                name:"2_PNAME",
                content: String(mail.patient.lastName + " " + mail.patient.firstName)
              }
            );
          }
        }
        Mailer.sendMail('email-message-kalendoc', doctor.user.email, emailContent, function() {
          console.log("Copy email message sent to " + doctor.user.email);
        });
      }
    });
  });
}
