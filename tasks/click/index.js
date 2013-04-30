var debug = require('debug');
var log = debug('dbj:task:click:info');
var error = debug('dbj:task:click:error');

var central = require(process.cwd() + '/lib/central');

var cwd = central.cwd;

var consts = require(cwd + '/models/consts');
var User = require(cwd + '/models/user');

var utils = central.utils;
var task = central.task;
var mongo = central.mongo;
var raven = central.raven;

var compute = task.compute_pool.pooled(function calculateClick(computings, arg, next) {

  var called = false;

  var error_cb = function(err) {
    arg.error(err);
    next();
  };
  var succeed_cb = function(result) {
    if (called) return;
    arg.success(result);
    called = true;
    next();
  };

  var users = arg.users;
  var is_valid = true;

  if (Array.isArray(users)) {
    for (var k in users) {
      if (users[k] instanceof User) continue;
      is_valid = false;
      break;
    }
    users = users.sort(function(a, b) {
      return a.id - b.id;
    });
  } else {
    is_valid = false;
  }

  if (!is_valid) {
    error('invalid users: %s', users);
    return error_cb(new Error('Invalid arguments'));
  }

  var uids = users.map(function(item) { return item.uid; });

  log('calculating click for %s', uids);

  require('./' + arg.job)(users, function(err, r) {
    if (err) return error_cb(err);
    succeed_cb(r);
  });
});

var exports = {};

function compute_by_ns(ns) {
  return function(arg) {
    module.exports.queue.safely(ns, arg);
    arg.job = ns;
    compute(arg);
  }
}

central.DOUBAN_APPS.forEach(function(ns) {
  exports[ns] = compute_by_ns(ns);
});

module.exports = exports;
