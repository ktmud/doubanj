/*
* aggregate user subject collections (called "interest") 
*/
var central = require(process.cwd() + '/lib/central');
var utils = central.utils;

var raven = central.raven;

var User = require(central.cwd + '/models/user');
var FetchStream = require('./stream');

function error(err, extra) {
  raven.error(err, { tags: { task: 'collect' }, extra: extra  });
}
function message(err, extra) {
  raven.message(err, { tags: { task: 'collect' }, extra: extra  });
}

var collect, _collect;
collect = User.ensured(function(user, arg) {
  if (!user) return arg.error('NO_USER');

  arg.user = user;

  // try update user info
  if (arg.force) {
    process.nextTick(function() {
      user.pull();
    });
  }

  var uid = user.uid || user.id;

  var raven_extra = { ns: arg.ns, uid: uid };
  message('collect interests start', raven_extra);

  var collector = new FetchStream(arg);

  // halt if syncing is already running
  if (user.last_synced_status === 'ing' && !arg.force && !arg._from_halt) {
    message('Collection exit due to runing..');
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
        message('collect interests succeed', raven_extra); 

        arg.success.call(collector, user);

        collector.emit('succeed');
      } else {
        error('collect interests failed at %s', collector.status, { uid: uid, ns: arg.ns }); 
        arg.error.call(collector, user);
      }
    }, 2000);
  });

  collector.once('succeed', function() {
    // run compute task right after success
    require('../compute')[arg.ns]({ user: user, force: true });
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
