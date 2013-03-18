/**
* Interest Base Class
*/
var debug = require('debug');
var util = require('util');
var log = debug('dbj:interest:info');
var verbose = debug('dbj:interest:verbose');
var error = debug('dbj:interest:error');

var conf = central.conf;
var mongo = central.mongo;
//var redis = central.redis;
var utils = central.utils;

var Subject = require('../subject');

var consts = require('../consts');
var DOUBAN_APPS = consts.DOUBAN_APPS;
var INTEREST_STATUS_LABELS = consts.INTEREST_STATUS_LABELS;
var APP_DATA_DEFAULT = {
  n_interest: 0
};

function Interest(info) {
  if (!(this instanceof Interest)) return new Interest(info);

  var self = this;
  utils.extend(self, info);
  //for (var i in info) {
    //this[i] = info[i];
  //}

  return this;
}

/**
* Inherited functions:
*/
util.inherits(Interest, mongo.Model);
utils.extend(Interest, mongo.Model);

Interest.prototype.kind = Interest._collection = 'interest';
Interest.prototype.subject_type = 'general';

Interest._cache_ttl = 36000;
Interest._default_sort = { 'updated': -1 };
//Interest.get = redis.cached.wrap(mongo.Model.get);

Interest.findByUser = function(uid, opts, cb) {
  verbose('getting interests obj for user %s', uid);

  var query = opts.query || {};
  query.user_id = uid;
  delete opts.query;
  return this.find(query, opts, cb);
};

/**
* Attach book subject
*/
Interest.book_attached = Interest.attached('subject_id', 'subject', Subject.book);
//Interest.movie_attached = Interest.attached('subject_id', Subject.movie);

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
  return INTEREST_STATUS_LABELS[this.subject_type][this.status] || unknown;
};

module.exports = Interest;
