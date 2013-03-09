var debug = require('debug');
var util = require('util');
var log = debug('dbj:interest:info');
var verbose = debug('dbj:interest:verbose');
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

  if (!self.subject_type) {
    for (var i = 0, l = DOUBAN_APPS.length; i < l; i++) {
      var ns = DOUBAN_APPS[i];
      if (info[ns + '_id']) {
        self[ns + '_id'] = self['subject_id'] = info[ns + '_id'];
        self.subject_type = self.subject_type = ns;
        break;
      }
    }
  }
  if (!self.subject_type) throw new Error('invalid interest details');

  return this;
}

util.inherits(Interest, mongo.Model);

Interest.prototype.kind = Interest.prototype._collection = INTEREST_COLLECTION;

Interest.get = function(ns, i_id, cb, attach_subject) {
  verbose('getting interest obj for %s', i_id)
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
Interest.find = function(ns, query, opts, cb) {

  opts = opts || {};
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  mongo(function(db) {
    var sort = opts.sort || 'updated';
    var collection = db.collection(ns + '_' + INTEREST_COLLECTION);

    if (typeof sort === 'string') {
      var obj = {};
      obj[sort] = opts.asc ? 1 : -1;
      sort = obj;
    }
    collection.find(query, {
      limit: opts.limit || 20,
      start: opts.start || 0,
      sort: sort
    }).toArray(function(err, docs) {
      if (err) {
        error('get interests failed: %s', err);
        return cb(err);
      }
      if (!docs || docs.length === 0) {
        log('get interests failed: ', 'no result');
        return cb(err);
      }

      verbose('found %s interests', docs.length);

      var ret = docs.map(function(item) {
        return new Interest(item);
      });
      verbose('extended to Interest.');

      if (opts.attach_subject === false) {
        verbose('no need for attach subject, interests got.');
        return cb(null, ret);
      }
      attachSubject(ns, ret, cb);
    });
  });
};
Interest.findByUser = function(ns, uid, opts, cb) {
  verbose('getting interests obj for user %s', uid);

  var query = opts.query || {};
  query.uid = uid;
  return Interest.find(ns, query, opts, cb);
};
Interest.gets = function(ns, ids, opts, cb) {
  var query = {
    'id': {
      '$in': ids
    },
  };
  return Interest.find(ns, query, opts, cb);
};

function attachSubject(ns, ret, next) {

  var called = false;
  function cb(err, ret) {
    if (called) return;
    next && next(err, ret);
    called = true;
  }

  var n = ret.length;
  function tick() {
    n--;
    if (n === 0) {
      verbose('all subjects attached.');
      cb(null, ret);
    }
  }

  var by_ids = {};
  ret.forEach(function(i) {
    by_ids[i.subject_id] = i;
  });

  var last_err = null;
  Subject.stream(ns, Object.keys(by_ids), function(stream) {
    stream.on('data', function(item) {
      s = Subject(item);
      var i = by_ids[s.id];
      i.subject = i[ns] = s;
    });
    stream.once('error', function(err) {
      last_err = err;
      error('getting subjects failed: %s', err);
    });
    stream.once('close', function() {
      cb(last_err, ret);
    });
  });

  // time out for stream
  setTimeout(function() {
    cb('TIMEOUT', ret);
  }, 12000);
}

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
Interest.prototype.subject_ns = function() {
  return this.subject_type;
};
Interest.prototype.status_cn = function(unknown) {
  unknown = '' || unknown;
  return INTEREST_STATUS_LABELS[this.ns || 'book'][this.status] || unknown;
};

module.exports = function(uid) {
  return new Interest(uid);
};
module.exports.Interest = Interest;
