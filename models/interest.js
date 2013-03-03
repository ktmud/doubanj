var debug = require('debug');
var util = require('util');
var log = debug('dbj:interest:info');
var error = debug('dbj:interest:error');

var cwd = process.cwd();
var conf = require(cwd + '/conf');

var mongo = require(cwd + '/lib/mongo');
var utils = require(cwd + '/lib/utils');

var Subject = require(cwd + '/models/subject').Subject;

var consts = require('./consts');
var DOUBAN_APPS = consts.DOUBAN_APPS;
var INTEREST_STATUS_LABELS = consts.INTEREST_STATUS_LABELS;
var APP_DATA_DEFAULT = {
  n_interest: 0
};
var INTEREST_COLLECTION = 'interest';

function Interest(info) {
  if (!(this instanceof Interest)) return new Interest(info);

  var self = this;
  utils.extend(self, info);
  //for (var i in info) {
    //this[i] = info[i];
  //}

  for (var i = 0, l = DOUBAN_APPS.length; i < l; i++) {
    var ns = DOUBAN_APPS[i];
    if (info[ns + '_id']) {
      self[ns + '_id'] = self['subject_id'] = info[ns + '_id'];
      self.subject_type = self.subject_type = ns;
    }
  }
  if (!self.subject_type) throw new Error('invalid interest details');

  return this;
}

util.inherits(Interest, mongo.Model);

Interest.prototype.kind = Interest.prototype._collection = INTEREST_COLLECTION;

Interest.get = function(ns, i_id, cb, attach_subject) {
  log('getting interest obj for %s', i_id)
  mongo(function(db) {
    var collection = db.collection(ns + '_' + INTEREST_COLLECTION);
    collection.findOne({
      '$or': [
        // douban id
        { 'id': i_id },
        // local id
        { '_id': i_id }
      ]
    }, function(err, r) {
      if (err !== null) {
        error('get interest failed: %s', err);
        return cb(err);
      }

      if (r) {
        var i = Interest(r);
        if (!attach_subject) return cb(null, i);

        // attach the subject
        Subject.get(ns, r.subject_id, function(err, s) {
          if (s) i.subject = new Subject(s);
          cb(null, i);
        }); 
        return;
      }
      log('interest %s not found', i_id);

      return cb(null, null);
    });
  });
};

Interest.findByUser = function(ns, uid, opts, cb) {
  log('getting interests obj for user %s', uid);

  opts = opts || {};
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  mongo(function(db) {
    var sort = opts.sort || 'updates';
    var collection = db.collection(ns + '_' + INTEREST_COLLECTION);
    collection.find({
      '$or': [
        // douban id
        { 'uid': uid },
        // local id
        { 'user_id': uid }
      ]
    }, {
      limit: opts.limit,
      sort: sort
    }).toArray(function(err, docs) {
      if (err) {
        error('get interests failed: %s', err);
        return cb(err);
      }
      if (docs.length === 0) {
        log('get interests failed: %s', 'none result');
        return cb(err);
      }

      log('found %s interests', docs.length);

      var reversed = true;
      if (sort != 'updated' || 'reversed' in opts) reversed = opts.reversed;
      if (reversed) docs = docs.reverse();

      var ret = docs.map(function(item) {
        var i = new Interest(item);
        return i;
      });
      log('extended to Interest.');

      if (opts.attach_subject === false) {
        log('no need for attach subject, interests got.');
        return cb(null, ret);
      }

      var n = ret.length;
      function tick() {
        n--;
        if (n === 0) {
          log('all subjects attached.');
          cb(null, ret);
        }
      }
      var sids = {};
      ret.forEach(function(i) {
        sids[i.subject_id] = i;
        //log('try getting interest\'s subject %s..', i.subject_id);
        //Subject.get(ns, i.subject_id, function(err, s) {
          //if (s) i.subject = i[ns] = s;
          //tick();
        //}); 
      });
      Subject.stream(ns, Object.keys(sids), function(stream) {
        stream.on('data', function(item) {
          s = Subject(item);
          var i = sids[s.id];
          i.subject = i[ns] = s;
        });
        stream.once('error', function(err) {
          error('getting subjects failed: %s', err);
          cb(err);
        });
        stream.on('close', function() {
          log('all subjects attached.');
          cb(null, ret);
        });
      });
    });
  });
};

Interest.prototype.toObject = function() {
  var self = this;
  var now = new Date();
  var ret = {
    '_id': self['_id'],
    'id': self['id'],
    'uid': self['uid'] || self['user_id'],
    'user_id': self['user_id'],
    'updated': self['updated'],
    'privacy': self['privacy'],
    'subject_type': self['subject_type'],
    'atime': now
  };
  var s_key = ret['subject_type'] + '_id';
  ret[s_key] = self[s_key];
  return ret;
};

Interest.prototype.istatus = function(ns, unknown) {
  unknown = '' || unknown;
  return INTEREST_STATUS_LABELS[ns || 'book'][this.status] || unknown;
};

module.exports = function(uid) {
  return new Interest(uid);
};
module.exports.Interest = Interest;
