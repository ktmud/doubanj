var cwd = process.cwd();
var task = require(cwd + '/lib/task');

var exports = module.exports;

/**
* reset queue status
*/
exports.reset = function(cb) {
  this.update({
    book_n: null,
    book_synced_n: 0,
    last_synced: new Date(),
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
    ps[0] = 5 + (user.book_synced_n / user.book_n) * 75;
  }
  // 20% percent is for computing
  ps[1] = ps[0] >= 80 ? (user.stats_p || 0) * 0.2 : 0;
  return ps;
};
/**
* interval for checking progress
*/
exports.progressInterval = function(remaining, delay) {
  return (remaining && remaining < delay + 3000) ? Math.max(remaining / 5, 600) : delay + 3000;
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

  return ret + this.statsRemaining();
};
exports.statsRemaining = function() {
  var user = this;

  var total = user.book_n;

  if (total === null) return null;

  if (user.stats_status === 'ing') {
    return Math.round(Math.sqrt(total)) * (user.stats_p || 100);
  }
  if (user.stats) return 0;
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
  return (task.API_REQ_DELAY + 4000) * Math.ceil((total - synced) / perpage);
}

/**
* syncing timeout
*/
exports.syncTimeout = function() {
  var sync_remaining = this.syncRemaining();
  // 30 minutes by default
  if (sync_remaining) sync_remaining = 1800000;
  return new Date() > this.last_synced + sync_remaining;
};

/**
* syncing timeout or failed
*/
exports.needResync = function() {
  var user = this;
  return !user.isIng() || (!user.stats && user.syncTimeout());
}
