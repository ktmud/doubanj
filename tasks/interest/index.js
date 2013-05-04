/*
* aggregate user subject collections (called "interest") 
*/
var central = require(process.cwd() + '/lib/central');
var utils = central.utils;
var async = require('async');

var raven = central.raven;

var User = require(central.cwd + '/models/user');
var FetchStream = require('./stream');

function error() {
  var args = [].slice.apply(arguments);
  var extra = args[args.length - 1] || {};
  args[args.length - 1] = { tags: { task: 'collect' }, extra: extra  };
  raven.error.apply(raven, args);
}
function message() {
  var args = [].slice.apply(arguments);
  var extra = args[args.length - 1] || {};
  args[args.length - 1] = { tags: { task: 'collect' }, extra: extra  };
  raven.message.apply(raven, args);
}

var collect, _collect;
collect = User.ensured(function(user, arg) {
  if (!user) return arg.error('NO_USER');

  arg.user = user;

  // try update user info
  if (arg.fresh && !arg._from_halt) {
    setImmediate(function() {
      user.pull();
    });
  }

  var uid = user.uid || user.id;

  var raven_extra = { ns: arg.ns, uid: uid };
  message('START collect interests for %s', uid, raven_extra);

  var collector = new FetchStream(arg);

  // halt if syncing is already running
  if (user.last_synced_status === 'ing' && !arg.force && !arg._from_halt) {
    message('EXIT collect for %s due to runing..', uid, raven_extra);
    arg.error(new Error('Already running collecting process.'));
    return;
  }

  collector.on('error', function(err) {
    console.trace(err);
    error(err, raven_extra);

    collector.status = 'failed';
    collector.updateUser(function() {
      collector.end();
    });
  });

  collector.on('saved', function(data) {
    collector.updateUser();
  });

  collector.once('end', function() {
    // wait for the really ends
    setTimeout(function() {
      if (collector.status == 'succeed') {
        message('SUCCEED collect interests for %s', uid, raven_extra); 

        arg.success.call(collector, user);

        collector.emit('succeed');
      } else {
        raven_extra.status = collector.status;
        error('Collect failed.', raven_extra); 
        arg.error.call(collector, user);
      }
    }, 2000);
  });

  collector.once('succeed', function() {
    // run compute task right after success
    require('../compute')[arg.ns]({
       user: user,
       force: true,
       success: function(user, all_results) {
          run_toplist(user, all_results);
       },
    });
  });

  collector.run();
});

function is_night() {
  var h = (new Date()).getHours();
  return h > 1 && h < 9;
}

function run_toplist(user, all_results) {
  var toplist = require('../toplist');

  try {
    clearTimeout(toplist._timer);
  } catch (e) {}

  var jobs = [];
  
  var total = all_results.book_stats.n_done;

  if (central.DEBUG) total = 20000;

  // 收藏数量太少的用户对最终结果应该也没什么影响
  if (total > 200) {
    jobs.push(async.apply(toplist.hardest_reader, 'last_30_days'));
  }
  if (total > 500) {
    jobs.push(async.apply(toplist.hardest_reader, 'last_12_month'));
  }
  if (total > 1000) {
    jobs.push(async.apply(toplist.hardest_reader, 'all_time'));

    /**
     * Use crontab to do this when in production
     */
    if (central.DEBUG) {
      // 某个tag下的热门图书
      jobs.push(async.apply(toplist.by_tag.subjects, 'book'));
      jobs.push(async.apply(toplist.by_tag.users, 'book', 'done'));
    }
  }

  toplist._timer = setTimeout(function() {
    // if there are ongoing computings, abort
    if (central._compute_queue.queue.length) return;
    // generate toplist one by one
    if (jobs.length) async.series(jobs);
  }, central.DEBUG ? 2000 : 300000); // 5 minutes of free
}

function collect_in_namespace(ns) {
  return function(arg) {
    // queue arguments safely
    exports.queue.safely('collect_' + ns, arg);

    arg.ns = ns;

    collect(arg.user, arg);
  };
}

var exports = {};

central.DOUBAN_APPS.forEach(function(item) {
  exports['collect_' + item] = collect_in_namespace(item);
});

// collect all the interest
exports.collect_all = function(user, succeed_cb, error_cb) {
  var called = false;
  var error_next = function(err) {
    if (called) return;
    called = true;
    error_cb && error_cb(err);
  }
  if (!user) return error_next('NO_USER');

  var apps = central.DOUBAN_APPS;
  var collectors = [];
  (function run(i) {
    var ns = apps[i];
    // all apps proceeded
    if (!ns) succeed_cb && succeed_cb(collectors);
    exports['collect_' + item]({
      user: user, 
      success: function(collectors) {
        collectors.push(collector);
        run(i+1);
      },
      error: error_next
    });
  })(0);
};
exports.collect = collect;

module.exports = exports;
