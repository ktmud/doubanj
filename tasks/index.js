module.exports = {};

var central = require('../lib/central');
var redis = central.redis;

var debug = require('debug');
var verbose = debug('dbj:tasks:verbose');
var log = debug('dbj:tasks:log');

var TaskQueue = require('./queue');

['interest', 'compute'].forEach(function(item) {
  var mod = module.exports[item] = require('./' + item);

  var queue = mod.queue = central['_' + item + '_queue'] = new TaskQueue('doubanj-queue-' + item, mod, redis.client);

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
