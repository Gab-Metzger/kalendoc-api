/**
 * Created by jaumard on 27/02/2015.
 */
module.exports.schedule = {
   // Order : second, minute, hour, day-of-month, month, day-of-week
   // "0 0 9 * * *" : function(){
   //    SmsService.sendConfirmations()
   // },

   "0 0 8 * * *" : function(){
      SmsService.reminders(false);
   }
};
