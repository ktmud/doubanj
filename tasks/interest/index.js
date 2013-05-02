/*
* aggregate user subject collections (called "interest") 
*/
var central = require(process.cwd() + '/lib/central');
var utils = central.utils;

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
    arg.error('RUNNING');
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
       success: function() {
          var toplist = require('../toplist');

          try {
            clearTimeout(toplist._timer);
          } catch (e) {}

          toplist._timer = setTimeout(function() {
            toplist.hardest_reader('last_30_days');
            toplist.hardest_reader('last_12_month');
            toplist.hardest_reader('all_time');
          }, 300000); // 5 minutes of free
       }
    });
  });

  collector.run();
});

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
