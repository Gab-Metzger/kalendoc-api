/**
 * medicalPro policy
 *
 * Medical professional : Secretary or doctor
 **/

module.exports = function(req,res,callback){
  if (!req.user) {
    return res.json(401, {err:req.__('Error.Token.Missing')});
  }
  if (req.user.doctor || req.user.secretary) {
    callback();
  } else {
    return res.json(403, {err:req.__('Error.Rights.Insufficient')});
  }
}