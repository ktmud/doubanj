/*
* compute the stastics
*/
var debug = require('debug');
var log = debug('dbj:task:compute:info');

var central = require(process.cwd() + '/lib/central');

var cwd = central.cwd;

var consts = require(cwd + '/models/consts');
var User = require(cwd + '/models/user');

var utils = central.utils;
var task = central.task;
var mongo = central.mongo;
var raven = central.raven;

var book_task = require('./book');

var compute, _compute;
compute = User.ensured(task.compute_pool.pooled(_compute = function(computings, arg, next) {
  var user = arg.user;
  var raven_extra = { extra: { uid: user.uid || user._id }, tags: { task: 'compute' } };

  if (!user) {
    return arg.error('NO_USER');
  }

  var called = false;
  var timeouts = {};
  var clear_timeouts = function() {
    for (var j in timeouts) {
      try {
        clearTimeout(timeouts[j]);
      } catch (e) {}
    }
  }

  var error_cb = function(err) {
    err = err || 'UNKNOWN';

    clear_timeouts();

    if (typeof error == 'string') {
      err = new Error(err);
      //console.log(err, err.type, err.message);
    }
    err.name = err.name || 'compute fail';
    raven.error(err, raven_extra);

    if (called) return;
    called = true;

    if (err === 'RUNNING') {
      arg.error(err);
    } else {
      var stats_fail = user.stats_fail || 0;
      // reset user's stats data if error happens
      log('resetting %s\'s compute status', user.uid);
      user.update({
        stats_fail: stats_fail + 1,
        stats_status: err,
      }, function() {
        arg.error(err);
      });
    }
    next();
  };

  var succeed_cb = function() {
    if (called) return;
    arg.success();
    next();
    called = true;
  };

  if (user.last_synced_status !== 'succeed') {
    if (user.syncTimeout()) {
      // reset user data
      user.update({
        invalid: 0,
        last_synced_status: 'TIMEOUT',
      }, function() {
        error_cb('TIMEOUT');
      });
      return;
    }
    return error_cb('NOT_READY');
  }

  // already running
  if (user.stats_status == 'ing' && !arg.force && !arg._from_halt) return error_cb('RUNNING');

  // not ready
  if (user.invalid) return error_cb(user.invalid);

  var stats = user.stats || {}; // save last stats date
  var all_results = {
    stats_fail: 0,
    stats_status: 'ing',
    stats_p: 0
  };
  user.update(all_results);

  var jobs_percent = {};

  function runJob(ns, done_percent) {
    var job = require('./' + ns);

    jobs_percent[ns] = 0;

    mongo.queue(function(db, next) {

      // 3 minutes timeout
      timeouts[ns] = setTimeout(function() {
        error_cb('TIMEOUT');
      }, 180000);

      // rung single job
      job(db, user, function(err, results) {
        if (err && !results) {
          error_cb(err);
          return next();
        }

        // already failed, no need to save..
        if (called) return;

        clearTimeout(timeouts[ns]);

        stats[ns] = new Date();
        all_results[ns + '_stats'] = results; 
        all_results[ns + '_stats_error'] = err && err.name || err; 

        var stats_p = all_results.stats_p;

        jobs_percent[ns] = done_percent;

        for (var j in jobs_percent) {
          stats_p += (jobs_percent[j] || 0); 
        }

        // all works done, safe to save.
        if (stats_p >= 100) {
          stats_p = 100;
          all_results.last_statsed = stats[ns];
          all_results.stats = stats;
          all_results.stats_p = stats_p;
          all_results.stats_status = 'succeed';

          // to ensure all the other writings are done.
          setTimeout(function() {
            user.update(all_results, function(err) {
              if (err) {
                error_cb(err);
              } else {
                succeed_cb(user);
              }
              next();
            });
          }, 1000);
        }
      }, function(percent) {
        if (called) return;

        // update computing percentage
        var stats_p = all_results.stats_p;
        var p = percent * done_percent / 100
        if (stats_p > p + 5) return;

        var obj = {
          stats_p: p
        };
        user.update(obj);
      });
    });
  }

  var per = Math.ceil(100 / arg.jobs.length);
  arg.jobs.forEach(function(item, i) {
    runJob(item, per);
  });
}));

function compute_by_ns(ns) {
  return function(arg) {
    module.exports.queue.safely(ns, arg);
    arg.jobs = [ns];
    compute(arg);
  }
}

central.DOUBAN_APPS.forEach(function(ns) {
  exports[ns] = compute_by_ns(ns);
});

module.exports.all = function(arg) {
  module.exports.queue.safely('all', arg);
  arg.jobs = ['book'];
  compute(arg);
};
