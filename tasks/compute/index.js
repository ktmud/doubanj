/*
* compute the stastics
*/
var debug = require('debug');
var log = debug('dbj:task:compute:info');
var error = debug('dbj:task:compute:error');

var cwd = process.cwd();

var consts = require(cwd + '/models/consts');
var task = require(cwd + '/lib/task');
var mongo = require(cwd + '/lib/mongo');

var user_ensured = require(cwd + '/models/user').ensured;
var Interest = require(cwd + '/models/interest').Interest;

var book_task = require('./book');

var compute, _compute;
compute = task.compute_pool.pooled(_compute = function(computings, arg, next) {
  user_ensured(function(arg) {
    var user = arg.user;

    var called = false;
    var timeouts = {};
    var error_cb = function(err) {
      err = err || 'UNKNOWN';

      for (var j in timeouts) {
        clearTimeout(timeouts[j]);
      }

      if (!user) {
        arg.error && arg.error(err);
        if (!called) next();
        called = true;
        return;
      }
      if (err.stack) { console.log(err.stack); }

      error('compute for %s failed: %s', user.uid, err);

      if (called) return;
      called = true;

      arg.error && arg.error(err);
      if (err !== 'RUNNING') {
        var stats_fail = user.stats_fail || 0;
        // reset user's stats data if error happens
        log('resetting %s\'s compute status', user.uid);
        user.update({
          stats_fail: stats_fail + 1,
          stats_status: err,
        });
      }
      next();
    };
    var succeed_cb = arg.success;

    if (!user) return error_cb('NO_USER');
    // already running
    if (user.stats_status == 'ing' && !arg.force) return error_cb('RUNNING');
    // not ready
    if (user.invalid) return error_cb(user.invalid);
    if (user.last_synced_status !== 'succeed') return error_cb('NOT_READY');

    // in queue means 5 percent of work has been done
    var obj = { stats_p: 5, stats_status: 'ing' };
    user.update(obj);

    var jobs = {};
    function runJob(ns, done_percent) {

      var job = require('./' + ns);

      jobs[ns] = 0;

      mongo.queue(function(db, next) {
        // rung single job
        job(db, user, function(err, results) {
          if (err) {
            error_cb(err);
            return next();
          }

          // already failed, no need to save..
          if (called) return;

          var stats = user.stats || {};
          stats[ns] = new Date();

          stats_p = 5;

          jobs[ns] = done_percent;

          for (var j in jobs) {
            stats_p += jobs[j] || 0; 
          }
          if (stats_p >= 100) {
            stats_p = 100;
            stats_status = 'succeed';
          }

          var obj = {
            stats: stats,
            stats_fail: 0,
            stats_status: stats_status,
            stats_p: stats_p
          };
          obj[ns + '_stats'] = results; 

          user.update(obj, function(err) {
            if (err) {
              error_cb(err);
            } else {
              succeed_cb && succeed_cb(user);
            }
            next();
          });
        }, function(percent) {
          if (called) return;
          var stats_p = user.stats_p || 5;
          var p = percent * done_percent / 100
          if (stats_p > p + 5) return;

          var obj = {
            stats_p: p
          };
          user.update(obj);
        });

        // timeout
        timeouts[ns] = setTimeout(function() {
          error_cb('TIMEOUT');
        }, 60000);
      });
    }

    runJob('book', 95);
  })(arg);
});

module.exports = compute;
