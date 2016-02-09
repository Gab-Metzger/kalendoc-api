/**
 * Created by jaumard on 27/02/2015.
 */
module.exports.schedule = {
   // Order : second, minute, hour, day-of-month, month, day-of-week
   // "0 0 9 * * *" : function(){
   //    SmsService.sendConfirmations()
   // },

   // "0 1 * * * *" : function(){
   //   console.log("TASK RUNNING");
   //    // SmsService.reminders(false);
   // }
  sailsInContext : true, //If sails is not as global and you want to have it in your task
  tasks : {
      //Every monday at 1am
      firstTask : {
         cron : "0 8 * * *",
         task : function (context, sails)
         {
              console.log("CRON TASK RUNNING");
              SmsService.reminders(false);
         },
         context : {}
      }
  }
};
