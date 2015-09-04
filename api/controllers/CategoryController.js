'use strict';

var _ = require('lodash');

/**
 * CategoryController
 *
 * @description :: Server-side logic for managing Categories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
  create: function(req,res){
    RightsManager.setDoctor(req, function(doctor, err){
      if (err) {
        return res.json(err.status, {err: err.message})
      } else {
        if (RightsManager.canAdminDoctor(req.user, doctor)){
          var params = req.allParams();
          params.doctor = doctor;
          if (params.name) {
            Label.findOrCreate({text: params.name}).exec(function(err,label){
              if (err) {
                res.json(500, {err:err});
              } else {
                params.name = label.id;
                params.consultingTime = params.consultingTime || doctor.consultingTime;
                Category.create(params).exec(function(err,cat){
                  if (err) {
                    res.json(400, {err:err});
                  } else {
                    // Waiting for https://github.com/balderdashy/waterline/issues/354
                    Category.findOne(cat.id).populate('name').exec(function(err,cat){
                      if (err) {
                        res.json(500, {err:err});
                      } else {
                        res.json(cat);
                      }
                    })
                  }
                })
              }
            });
          } else {
            res.json(400, {err: req.__('Error.Fields.Missing')});
          }
        } else {
          return res.json(401, {err: req.__('Error.Rights.Insufficient')});
        }
      }
    })
  },
  update: function(req,res){
    var params = req.allParams();
    if (params.id) {
      Category.findOne(params.id).populate("doctor").exec(function(err,cat){
        if (err) {
          res.json(err.status, {err: err.message});
        } else if (!cat) {
          res.json(404, {err: req.__('Collection.Category')+" "+req.__('Error.NotFound')});
        } else {
          if (RightsManager.canAdminDoctor(req.user,cat.doctor)) {
            delete params.doctor;
            if (params.name) {
              Label.findOrCreate({text: params.name}).exec(function(err,label){
                if (err) {
                  res.json(500, {err:err});
                } else {
                  params.name = label.id;
                  Category.update(params.id, params).exec(function(err,cat){
                    if (err) {
                      res.json(400, {err:err});
                    } else {
                      res.json(cat);
                    }
                  });
                }
              });
            } else {
              Category.update(params.id, params).exec(function(err,cat){
                if (err) {
                  res.json(400, {err:err});
                } else {
                  res.json(cat);
                }
              });
            }
          } else {
            res.json(401, {err: req.__('Error.Rights.Insufficient')})
          }
        }
      })
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  },

  find: function(req,res){
    var params = req.allParams();
    Category.find({doctor: params.doctor}).populate('name').exec(function(err,cat){
      if (err) {
        return res.json(500,{err:err});
      } else {
        return res.json(cat);
      }
    });
  },

  findLabel: function(req,res){
    var params = req.allParams();
    params.text = params.text || ""
    Label.find({
      text: {
        'like':params.text+'%'
      }
    }).exec(function(err,labels){
      if (err) {
        res.json(500, {err:err});
      } else {
        res.json(_.map(labels,function(n){return n.text}));
      }
    });
  },

  destroy: function(req,res){
    var params = req.allParams();
    if (params.id) {
      Category.findOne(params.id).populate('doctor').exec(function(err,cat){
        if (err) {
          res.json(500, {err:err});
        } else if (!cat) {
          res.json(404, {err: req.__('Collection.Category')+' '+req.__('Error.NotFound')});
        } else {
          if (RightsManager.canAdminDoctor(req.user, cat.doctor)) {
            Category.destroy(params.id).exec(function(err,category){
              if (err) {
                res.json(500, {err:err});
              } else {
                res.json(category);
              }
            })
          } else {
            res.json(401, {err: req.__('Error.Rights.Insufficient')});
          }
        }
      })
    } else {
      res.json(400, {err: req.__('Error.Fields.Missing')});
    }
  }
});

