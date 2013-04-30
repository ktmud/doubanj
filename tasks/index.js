module.exports = {};

var central = require('../lib/central');
var redis = central.redis;

var debug = require('debug');
var verbose = debug('dbj:tasks:verbose');
var log = debug('dbj:tasks:log');

var Resumable = require('resumable');

var User = require('../models/user');

['interest', 'compute', 'click'].forEach(function(item) {
  var mod = module.exports[item] = require('./' + item);

  var queue = new Resumable({
    key: 'doubanj-queue-' + item,
    mod: mod,
    storage: redis.client,
    autoLoad: true,
    ensure: function(list) {
      var seen = {};
      var ret = list.filter(function(arg) {
        if (!arg[0] || !arg[1]) return false;
        if (arg[1].user in seen) return false;
        seen[arg[1].user] = 1;
        return true;
      });
      return ret;
    },
    stringify: function(k, v) {
      if (v instanceof User) {
        return v.uid || v._id;
      }
      return v;
    }
  });

  mod.queue = central['_' + item + '_queue'] = queue;

  // let the queue resume undone works.
  queue.on('ready', function(q) {
    verbose('Task queue for ' + item + ' loaded.');
    log('%s unfinished task for %s', q.length, item);
    this.resume();
  });

  queue.on('dumped', function() {
    log('Task queue for ' + item + ' dumped.');
  });

  module.exports[item + '_queue'] = queue;
});
