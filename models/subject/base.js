var debug = require('debug');
var util = require('util');
var log = debug('dbj:subject:info');
var error = debug('dbj:subject:error');

var cwd = central.cwd;
var conf = central.conf;
var task = central.task;
var mongo = central.mongo;
var utils = central.utils;

function Subject(info) {
  if (!(this instanceof Subject)) return new Subject(info);

  utils.extend(this, info);
  this.prop_keys = Object.keys(info);

  return this;
}
util.inherits(Subject, mongo.Model);
utils.extend(Subject, mongo.Model);

Subject.prototype.kind = Subject._collection = 'subject';

Subject.prototype.toObject = function() {
  var self = this;
  var now = new Date();
  var ret = {
    atime: now,
    mtime: self.mtime,
  };
  self.prop_keys.forEach(function(k) {
    ret[k] = self[k];
  });
  return ret;
};
Subject.prototype.db_url = function() {
  return 'http://' + this.kind + '.douban.com/subject/' + this.id + '/';
};

module.exports = Subject;
