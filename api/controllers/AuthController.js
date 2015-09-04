/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  login: function(req,res){
    Login.login(req.param('email'),req.param('password'),req,function(err,code,user){
      if (!user) {
        return res.json(code,{err:err});
      } else {
        return res.json({
          user: user,
          token: JsonWebToken.create({id: user.id})
        });
      }
    });
  },
  sendReset: function(req,res){
    var params = req.allParams();
    if (params.email) {
      User.findOne({email: params.email}).exec(function(err,user){
        if (err) {
          res.json(500,{err:err});
        } else if (user) {
          var token = JsonWebToken.create({reset_user:user.id});
          Mailer.sendMail('email-r-initialisation-mot-de-passe-kalendoc',user.email,[
            {name:"1_RESET_PASSWORD_URL",content:sails.config.appURL+"auth/password-reset?token="+token}
          ],function(){});
          res.json("OK");
        } else {
          res.json(404, {err: req.__('Collection.User')+" "+req.__('Error.NotFound')});
        }
      });
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  },

  resetPassword: function(req,res){
    var params = req.allParams();
    if (params.password && params.token) {
      JsonWebToken.verify(params.token,function(err,token){
        if (err) {
          res.json(401, {err: req.__('Error.Token.Invalid')})
        } else {
          User.findOne(token.reset_user).exec(function(err,user){
            if (err) {
              res.json(500, {err:err});
            } else {
              if (! user) {
                res.json(401, {err:req.__('Error.Token.Invalid')})
              } else {
                User.update(token.reset_user,{password: params.password}).exec(function(err,user){
                  if (err) {
                    res.json(500,{err:err});
                  } else {
                    res.json("OK");
                  }
                });
              }
            }
          });
        }
      });
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  }

};

