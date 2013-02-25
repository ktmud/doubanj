var debug = require('debug');
var util = require('util');
var log = debug('dbj:subject:info');
var error = debug('dbj:subject:error');

var cwd = central.cwd;
var conf = central.conf;
var task = central.task;

var mongo = require(cwd + '/lib/mongo');
var utils = require(cwd + '/lib/utils');

var APP_DATA_DEFAULT = {
  n_subject: 0
};
var SUBJECT_COLLECTION = 'subject';

function Subject(info) {
  if (!(this instanceof Subject)) return new Subject(info);

  utils.extend(this, info);
  this.prop_keys = Object.keys(info);

  return this;
}

util.inherits(Subject, mongo.Model);

Subject.prototype.kind = Subject.prototype._collection = SUBJECT_COLLECTION;

Subject.get = function(ns, s_id, cb) {
  //log('getting subject obj for %s', s_id)
  mongo(function(db) {
    var collection = db.collection(ns);
    collection.findOne({
      '$or': [
        // douban id
        { 'id': s_id },
        // local id
        { '_id': s_id }
      ]
    }, function(err, r) {
      if (err) {
        log('get subject failed: %s', err);
        return cb(err);
      }

      if (r) {
        //log('subject %s found', s_id);
        return cb(null, Subject(r));
      }

      log('subject %s not found', s_id);

      return cb(null, null);
    });
  });
};
Subject.gets = function(ns, ids, cb) {
  mongo(function(db) {
    var collection = db.collection(ns);
    collection.find({
      'id': { '$in': ids }
    }).toArray(function(err, docs) {
      if (err) return cb(err);
      var ret = docs.map(function(i) {
        return new Subject(i);
      });
      cb(null, ret);
    });
  });
};
Subject.stream = function(ns, ids, cb) {
  mongo(function(db) {
    var collection = db.collection(ns);
    cb(collection.find({
      'id': { '$in': ids }
    }).stream());
  });
};


Subject.prototype.toObject = function() {
  var self = this;
  var now = new Date();
  var ret = {};
  self.prop_keys.forEach(function(k) {
    ret[k] = self[k];
  });
  ret['atime'] = now;
  return ret;
};

module.exports = function(uid) {
  return new Subject(uid);
};
module.exports.Subject = Subject;
