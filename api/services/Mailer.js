/**
 * Mailer.js
 **/
var mailgun = require('mailgun-js')({ apiKey: "key-973b32af2e158ef91a9259435a65d597", domain: 'mg.kalendoc.com' });
var mailcomposer = require('mailcomposer');
var fs = require('fs');

var blockOperatrice='Vous avez été accueilli par *|5_FNAMEOPERATOR|*. <a href="https://www.facebook.com/kalendoc/reviews" target="_blank">Cliquez ici</a> pour poster un commentaire.';

module.exports.sendMail = function(templateName,emailDest,mergedVars){

  chooseTemplate(templateName, mergedVars, emailDest, function (mail) {
    mail.build(function(mailBuildError, message) {

        var dataToSend = {
            to: emailDest,
            message: message.toString('ascii')
        };

        mailgun.messages().sendMime(dataToSend, function (sendError, body) {
            if (sendError) {
                console.log(sendError);
                return;
            } else {
              sails.log.info("Mail sent to "+emailDest);
            }
            return;
        });
    });
  });  
}

function chooseTemplate(templateName, mergedVars, emailDest, cb) {
  if(templateName=="email-confirmation"){
    emailConf(mergedVars,emailDest,cb);
  }
  else if(templateName=="email-rappel") {
    emailRappel(mergedVars,emailDest,cb);
  }
  else if(templateName=="email-password") {
    emailPass(mergedVars,emailDest,cb);
  }
  else if(templateName=='email-creation-compte') {
    emailCreateUser(mergedVars,emailDest,cb);
  }

}


function emailConf(mergedVars,emailDest,cb){
  fs.readFile('api/templates/email-confirmation.html', function(err,res){

    if(err){
      console.log(err);
    }

    var template = res.toString();


    template=template.replace('*|0_FNAME|*',mergedVars["firstName"]);
    template=template.replace('*|1_DNAME|*',mergedVars["docName"]);
    template=template.replace('*|2_DATERDV|*',mergedVars["dateRDV"]);
    template=template.replace('*|3_HOURRDV|*',mergedVars["heureRDV"]);
    template=template.replace('*|4_ADDRESS|*',mergedVars["adrsRDV"]);

    if(mergedVars["opName"]){
      template=template.replace('*|5_BLOCKOPERATOR|*',blockOperatrice.replace('*|5_FNAMEOPERATOR|*',mergedVars["opName"]))
    }
    else {
      template=template.replace('*|5_BLOCKOPERATOR|*','');
    }

    var mail = mailcomposer({
      from: "Kalendoc <contact@kalendoc.com>",
      to: emailDest,
      subject: 'Confirmation du rendez-vous avec le Docteur '+mergedVars["docName"],
      body: mergedVars["firstName"]+', nous confirmons votre rendez-vous avec le Docteur '+mergedVars["docName"]+' le '+mergedVars["dateRDV"]+" "+mergedVars["heureRDV"],
      html: template
    });

    cb(mail); 

  });

}


function emailRappel(mergedVars,emailDest,cb){
  fs.readFile('api/templates/email-rappel.html', function(err,res){

    if(err){
      console.log(err);
    }

    var template = res.toString();

    template=template.replace('*|0_FNAME|*',mergedVars["firstName"]);
    template=template.replace('*|1_DNAME|*',mergedVars["docName"]);
    template=template.replace('*|2_DATERDV|*',mergedVars["dateRDV"]);
    template=template.replace('*|3_HOURRDV|*',mergedVars["heureRDV"]);
    template=template.replace('*|4_ADDRESS|*',mergedVars["adrsRDV"]);

    var mail = mailcomposer({
      from: "Kalendoc <contact@kalendoc.com>",
      to: emailDest,
      subject: 'Rappel du rendez-vous avec le Docteur '+mergedVars["docName"],
      body: mergedVars["firstName"]+', nous vous rappelons votre rendez-vous avec le Docteur '+mergedVars["docName"]+' le '+mergedVars["dateRDV"]+" "+mergedVars["heureRDV"],
      html: template
    });
    
    cb(mail);

  });
}


function emailPass(mergedVars,emailDest,cb){
  fs.readFile('api/templates/email-password.html', function(err,res){

    if(err){
      console.log(err);
    }

    var template = res.toString();

    template=template.replace('*|0_FNAME|*',mergedVars["firstName"]);
    template=template.replace('*|1_TOKEN|*',mergedVars["token"]);

    var mail = mailcomposer({
      from: "Kalendoc <contact@kalendoc.com>",
      to: emailDest,
      subject: 'Réinitialisation de votre mot de passe Kalendoc',
      body: 'Veuillez aller sur ce lien : http://www.kalendoc.com/reset/'+mergedVars["token"],
      html: template
    });

    cb(mail);

  });
}

function emailCreateUser(mergedVars,emailDest,cb){
  fs.readFile('api/templates/email-creation-compte.html', function(err,res){

    if(err){
      console.log(err);
    }

    var template = res.toString();


    template=template.replace('*|1_EMAIL|*',mergedVars["email"]);
    template=template.replace('*|2_MDP|*',mergedVars["password"]);


    var mail = mailcomposer({
      from: "Kalendoc <contact@kalendoc.com>",
      to: emailDest,
      subject: 'Création de votre compte sur Kalendoc.com',
      body: "Votre compte a bien été créé avec cette adresse email : "+emailDest,
      html: template
    });

    cb(mail);
    
  });
}
