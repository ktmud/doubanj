/*
* compute the stastics
*/
var debug = require('debug')
var log = debug('dbj:task:compute:info')

var central = require(process.cwd() + '/lib/central')

var cwd = central.cwd

var consts = require(cwd + '/models/consts')
var User = require(cwd + '/models/user')

var utils = central.utils
var task = central.task
var mongo = central.mongo
var raven = central.raven

var book_task = require('./book')

var compute, _compute
compute = User.ensured(task.compute_pool.pooled(_compute = function(computings, arg, next) {
  var user = arg.user

  if (!user) {
    return arg.error(new Error('A user for compute is required.'))
  }

  var raven_extra = { extra: { uid: user.uid || user._id }, tags: { task: 'compute' } }

  var called = false
  var timeouts = {}
  var clear_timeouts = function() {
    for (var j in timeouts) {
      try {
        clearTimeout(timeouts[j])
      } catch (e) {}
    }
  }

  var error_cb = function(err) {
    err = err || new Error('UNKNOWN')

    clear_timeouts()

    if (typeof error == 'string') {
      err = new Error(err)
      //console.log(err, err.type, err.message)
    }
    err.name = err.name || 'compute fail'
    raven.error(err, raven_extra)

    if (called) return
    called = true

    if (err.message === 'RUNNING') {
      arg.error(err)
    } else {
      var stats_fail = user.stats_fail || 0
      // reset user's stats data if error happens
      log('resetting %s\'s compute status', user.uid)
      user.update({
        stats_fail: stats_fail + 1,
        stats_status: err,
      }, function() {
        arg.error(err)
      })
    }
    next()
  }

  var succeed_cb = function(user, all_results) {
    if (called) return
    called = true
    user.update(all_results, function(err) {
      if (err) {
        // save failed
        return error_cb(err)
      }
      log('Computing for %s done.', user.uid)
      arg.success(user, all_results)
      next()
    })
    run_toplist(user, all_results.book_stats.n_done);
  }

  if (new Date() - user.last_statsed < 60000) {
    return error_cb(new Error('Compute again too soon'))
  }

  if (user.last_synced_status !== 'succeed') {
    if (user.syncTimeout()) {
      var err = new Error('Syncing timeout')
      // reset user data
      user.update({
        invalid: 0,
        last_synced_status: 'TIMEOUT',
      }, function() {
        error_cb(err)
      })
      return
    }
    return error_cb(new Error('User stats not ready'))
  }

  // already running
  if (user.stats_status == 'ing' && !arg.force && !arg._from_halt) {
    return error_cb(new Error('RUNNING'))
  }

  // not ready
  if (user.invalid) return error_cb(user.invalid)

  var stats = user.stats || {} // save last stats date
  var all_results = {
    stats_fail: 0,
    stats_status: 'ing',
    stats_p: 0
  }
  user.update(all_results)

  var jobs_percent = {}

  function runJob(ns, done_percent) {
    var job = require('./' + ns)

    jobs_percent[ns] = 0

    mongo.queue(function(db, release) {
      // 10 minutes timeout
      timeouts[ns] = setTimeout(function() {
        error_cb(new Error('Compute timeout'))
      }, 600000)

      // rung single job
      job(db, user, function(err, results) {

        release()

        if (err && !results) {
          return error_cb(err)
        }

        clearTimeout(timeouts[ns])

        stats[ns] = new Date()

        all_results[ns + '_stats'] = results
        all_results[ns + '_stats_error'] = err && err.name || err

        var stats_p = all_results.stats_p

        jobs_percent[ns] = done_percent

        for (var j in jobs_percent) {
          stats_p += (jobs_percent[j] || 0)
        }

        // all works done, safe to save.
        if (stats_p < 100) return

        stats_p = 100
        all_results.last_statsed = stats[ns]

        all_results.stats = stats

        all_results.stats_p = stats_p
        all_results.stats_status = 'succeed'

        succeed_cb(user, all_results)
      }, function progress(percent) {
        if (called) return
        // update computing percentage
        var stats_p = all_results.stats_p
        var p = percent * done_percent / 100
        if (stats_p > p + 5) return
        user.update({ stats_p: p })
      })
    }, 5)
  }

  var per = Math.ceil(100 / arg.jobs.length)
  arg.jobs.forEach(function(item, i) {
    runJob(item, per)
  })
}))

function compute_by_ns(ns) {
  return function(arg) {
    module.exports.queue.safely(ns, arg)
    arg.jobs = [ns]
    compute(arg)
  }
}


var toplist_timer;

function run_toplist(user, total) {
  try {
    clearTimeout(toplist_timer);
  } catch (e) {}

  var jobs = [];

  if (central.DEBUG) total = 20000;

  toplist_timer = setTimeout(function() {
    // generate toplist one by one
    require('../toplist').run(total)
  }, central.DEBUG ? 2000 : 60 * 1000); // 1 minutes of free
}

central.DOUBAN_APPS.forEach(function(ns) {
  exports[ns] = compute_by_ns(ns)
})

module.exports.all = function(arg) {
  module.exports.queue.safely('all', arg)
  arg.jobs = ['book']
  compute(arg)
}
