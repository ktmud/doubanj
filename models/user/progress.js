var cwd = process.cwd();
var task = require(cwd + '/lib/task');

var exports = module.exports;

/**
* reset queue status
*/
exports.reset = function(cb) {
  this.update({
    stats_p: 0,
    stats_status: null,
    book_n: null,
    book_synced_n: 0,
    last_synced: new Date(),
    last_synced_status: 'ing'
  }, cb);
};

/**
* Mark sync start
*/
exports.markSync = function(cb) {
  this.update({
    stats_p: 0,
    stats_status: null,
    last_synced_status: 'ing'
  }, cb);
};

/**
* is syncing or statsing, not finished yet
*/
exports.isIng = function() {
  return this.last_synced_status === 'ing' || this.stats_status === 'ing';
};

/**
* total progress in percent
*/
exports.progress = function() {
  var ps = this.progresses();
  var n = 0;
  ps.forEach(function(item) {
    n += item;
  });
  return n;
};
/**
* @return {array}
*/
exports.progresses = function() {
  var ps = [0, 0];
  var user = this;
  // got douban account info
  if (user.created) ps[0] = 5;
  // starting to sync
  if (user.last_synced) ps[0] = 10;

  if (user.book_n === 0) {
    ps[0] = 80;
  } else if (user.book_n && user.book_synced_n) {
    // only book for now
    ps[0] = 10 + Math.ceil((user.book_synced_n / user.book_n) * 70);
  }
  // 20% percent is for computing
  ps[1] = ps[0] >= 80 ? Math.ceil((user.stats_p || 0) * 0.2) : 0;
  return ps;
};
/**
* interval for checking progress
*/
exports.progressInterval = function(remaining, delay) {
  var n = central._interest_queue && central._interest_queue.queue.length || 1;
  delay = delay * n;
  return remaining < 10000 ? 4000 : delay + 2000;
};

exports.isEmpty = function(ns) {
  if (!ns) return null;
  return this[ns+'_n'] === 0;
};

/**
* total remaining
*/
exports.remaining = function() {
  var ret = this.syncRemaining();
  if (ret === null) return null;

  var sr = this.statsRemaining();

  // 10 seconds for stats by default
  if (ret && sr === null) sr = 10000;

  if (ret === 0 && sr === null) return null;

  return ret + sr;
};
exports.statsRemaining = function() {
  var user = this;

  var total = user.book_n;

  if (total === null) return null;

  if (user.isIng()) {
    // At least five seconds
    return Math.round(Math.sqrt(total) * (100 - (user.stats_p || 0)) * 2.5) + 5000;
  }

  return null;
};
/**
* expected remaing time for finish collectng job
*/
exports.syncRemaining = function() {
  var user = this;
  var total = user.book_n;
  var synced = user.book_synced_n;

  if (!total) return null;

  var perpage = task.API_REQ_PERPAGE;

  var n = central._interest_queue && central._interest_queue.queue.length || 1;

  //console.log(n);

  return (task.API_REQ_DELAY + 4000) * n * Math.ceil((total - synced) / perpage);
};

exports.isSyncing = function() {
  return this.last_synced_status === 'ing'
};

/**
* is syncing timeout
*/
exports.syncTimeout = function() {
  var remaining = this.remaining();
  // 30 minutes by default
  if (remaining === null || this.last_synced === null) return false;

  return new Date() - this.last_synced > remaining + 300000;
};

/**
* syncing timeout or failed
*/
exports.needResync = function() {
  var user = this;
  return !user.isIng() || (!user.stats && user.syncTimeout());
}
