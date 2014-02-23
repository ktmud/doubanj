var cwd = process.cwd()
var task = require('../../lib/task')
var tasks = require('../../tasks/')

var User = require('./index')

var DB_RESPOND_DELAY = 5000

/**
* reset queue status
*/
User.prototype.reset = function(cb) {
  this.update({
    stats_p: 0,
    stats_status: null,
    book_n: null,
    book_synced_n: 0,
    last_synced: new Date(),
    last_synced_status: 'ing'
  }, cb)
}

/**
* Mark sync start
*/
User.prototype.markSync = function(cb) {
  this.update({
    stats_p: 0,
    stats_status: null,
    last_synced_status: 'ing'
  }, cb)
}

/**
* is syncing or statsing, not finished yet
*/
User.prototype.isIng = function() {
  return this.last_synced_status === 'ing' || this.stats_status === 'ing'
}

/**
* total progress in percent
*/
User.prototype.progress = function() {
  var ps = this.progresses()
  var n = 0
  ps.forEach(function(item) {
    n += item
  })
  return n
}
/**
* @return {array}
*/
User.prototype.progresses = function() {
  var ps = [0, 0]
  var user = this
  // got douban account info
  if (user.created) ps[0] = 5
  // starting to sync
  if (user.last_synced) ps[0] = 10

  if (user.book_n === 0) {
    ps[0] = 80
  } else if (user.book_n && user.book_synced_n) {
    // only book for now
    ps[0] = 10 + Math.ceil((user.book_synced_n / user.book_n) * 70)
  }
  // 20% percent is for computing
  ps[1] = ps[0] >= 80 ? Math.ceil((user.stats_p || 0) * 0.2) : 0
  return ps
}
/**
* interval for checking progress
*/
User.prototype.progressInterval = function(remaining, delay) {
  var n = this.queue_length()
  delay = delay * n
  return remaining < 10000 ? DB_RESPOND_DELAY : delay + 2000
}
User.prototype.queue_length = function() {
  return tasks.getQueueLength('interest')
}

User.prototype.isEmpty = function(ns) {
  if (!ns) return null
  return this[ns+'_n'] === 0
}

/**
* total remaining
*/
User.prototype.remaining = function() {
  var ret = this.syncRemaining()
  if (ret === null) return null

  var sr = this.statsRemaining()

  // 10 seconds for stats by default
  if (ret && sr === null) sr = 10000

  if (ret === 0 && sr === null) return null

  return ret + sr
}
User.prototype.statsRemaining = function() {
  var user = this

  var total = user.book_n

  if (total === null) return null

  if (user.isIng()) {
    // At least five seconds
    return Math.round(Math.sqrt(total) * (100 - (user.stats_p || 0)) * 2.5) + 5000
  }

  return null
}
/**
* expected remaing time for finish collectng job
*/
User.prototype.syncRemaining = function() {
  var user = this
  var total = user.book_n
  var synced = user.book_synced_n

  if (!total) return null

  var perpage = task.API_REQ_PERPAGE

  var n = this.queue_length()

  return (task.API_REQ_DELAY + DB_RESPOND_DELAY) * n * Math.ceil((total - synced) / perpage)
}

User.prototype.isSyncing = function() {
  return this.last_synced_status === 'ing'
}

/**
* is syncing timeout
*/
User.prototype.syncTimeout = function() {
  var remaining = this.remaining()
  // 30 minutes by default
  if (remaining === null || this.last_synced === null) return false

  return new Date() - this.last_synced > remaining + 300000
}
User.prototype.syncFailed = function() {
  return this.last_synced_status !== 'ing' || this.last_synced_status !== 'succeed'
}

/**
* syncing timeout or failed
*/
User.prototype.needResync = function() {
  var user = this
  return !user.isIng() || (!user.stats && user.syncTimeout())
}
