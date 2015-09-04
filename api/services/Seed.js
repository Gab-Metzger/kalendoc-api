/**
 * Seed.js
 * Help with db seed
 **/

module.exports = {

  seedModels: function(models){
    if (models.length != 0) {
      var model = models.shift();
      console.log("Seeding "+model+"...");
      sails.models[model.toLowerCase()].create(require("../../test/fixtures/"+model+".json")).exec(function(err,res){
        if (err) {
          console.log(err);
        } else {
          Seed.seedModels(models)
        }
      })
    } else {
      console.log("Done!")
    }
  },

  seedAll:function(){
    Seed.seedModels(['Label','User','Doctor','Secretary','Patient','Category','Reservation','Appointment'],[]);
  }
}