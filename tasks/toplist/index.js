var async = require('async')
var tasks = require('../../tasks')
var central = require('../../lib/central')
var cached = require('../../lib/cached')
var getToplistKey = require('../../models/toplist').getToplistKey
var mongo = central.mongo

var debug = require('debug')
var log = debug('dbj:toplist:log')
var verbose = debug('dbj:toplist:verbose')
var error = debug('dbj:toplist:error')

var ONE_MONTH = 60 * 60 * 24 * 1000 * 30.5

function aggregate_hardest_reader(period, cb) {
  cb = cb || function(){}
  period = period || 'all_time'

  var key = getToplistKey('book', period)
  var now = new Date()
  var query = {
    status: 'done',
    commented: { $gt: 3 }
  }
  switch(period) {
    case 'last_30_days':
      query.updated = {
        $gte: new Date(now - ONE_MONTH)
      }
      break
    case 'this_year':
      query.updated = {
        $gte: new Date('' + now.getFullYear())
      }
      break
    case 'last_year':
      query.updated = {
        $gte: new Date('' + (now.getFullYear() - 1)),
        $lt: new Date('' + now.getFullYear())
      }
      break
    case 'last_12_month':
      query.updated = {
        $gt: new Date(now - ONE_MONTH * 12),
      }
      break
    default:
      break
  }

  var pipe = [
    { $match: query },
    { $sort: { user_id: 1 } },
    { $project: { user_id: 1 } },
    { $group: {
        _id: "$user_id",
        value: { $sum: 1 }
    }},
    { $sort: { value: -1 } },
    { $limit: 500 }
  ]

  mongo.queue(function(db, next) {
    log('Generating Toplist for %s...', key)
    db.collection('book_interest').aggregate(pipe, function(err, results) {
      next()
      if (err) {
        error('Toplist failed: ', err)
        return cb(err)
      }
      log('Toplist for %s generated.', key)
      cached.set(key, results, cb)
      cached.del(key + '_cached', function(){})
    })
  }, 5) // 5 means low priority
}

exports.hardest_reader = aggregate_hardest_reader
exports.by_tag = require('./by_tag')


function breakable(period) {
  return function(callback) {
    // if some task is running, break
    if (tasks.getQueueLength()) {
      log('Exit compute toplist %s due to running computing.', period)
      return callback()
    }
    aggregate_hardest_reader(period, callback)
  }
}

exports.run = function(total, callback) {
  var jobs = []
  // 收藏数量太少的用户对最终结果应该也没什么影响
  if (total > 200) {
    jobs.push(breakable('last_30_days'))
  }
  if (total > 500) {
    jobs.push(breakable('last_12_month'))
  }
  if (total > 2000) {
    jobs.push(breakable('all_time'))
  }
  if (jobs.length) {
    async.series(jobs, callback)
  }
}
