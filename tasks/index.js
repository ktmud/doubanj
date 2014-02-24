var tasks = {};

module.exports = tasks

var central = require('../lib/central');
var Resumable = require('resumable');
var User = require('../models/user');

var redis = central.redis;

var debug = require('debug');
var verbose = debug('dbj:tasks:verbose');
var log = debug('dbj:tasks:log');

var names = ['interest', 'compute', 'click'];

names.forEach(function(item) {
  var mod = tasks[item] = require('./' + item);

  var queue = mod.queue = new Resumable({
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

  // let the queue resume undone works.
  queue.on('ready', function(q) {
    verbose('Task queue for ' + item + ' loaded.');
    log('%s unfinished task for %s', q.length, item);
    this.resume();
  });

  queue.on('dumped', function() {
    log('Queue %s dumped.', queue.key);
  });

  tasks[item + '_queue'] = queue;
});

tasks.setKeyPrefix = function(prefix) {
  names.forEach(function(item) {
    tasks[item + '_queue'].key = prefix + item;
  });
}

tasks.getQueueLength = function(name) {
  if (!name) {
    var total = 0
    names.forEach(function(item) {
      total += tasks.getQueueLength(item)
    })
    return total
  }
  var queue = tasks.getQueue(name)
  if (queue) {
    return queue.queue.length
  }
  return 0
}

tasks.getQueue = function(name) {
  return tasks[name + '_queue']
}
