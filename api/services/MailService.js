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
        var emailContent =
          {
            'receiverName': mail.receiverName,
            "action": mail.action,
            "senderName": mail.senderName,
            "content": mail.content
          };
        if (mail.patient) {
          emailContent["patient"]=true;

          emailContent["patName"]=String(mail.patient.lastName + " " + mail.patient.firstName);

          if (mail.patient.mobilePhone || mail.patient.phoneNumber) {
            emailContent["patPhone"]=mail.patient.mobilePhone || mail.patient.phoneNumber;
          }
        }
        Mailer.sendMail('email-message-kalendoc', doctor.user.email, emailContent, function() {
          console.log("Copy email message sent to " + doctor.user.email);
        });
      }
    });
  });
}
