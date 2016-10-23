#!/usr/bin/env node

/**
 * Update all users in background.
 */
var log = require('debug')('dbj:tool:update')

var User = require('../models/user')
var cached = require('../lib/cached')
var tasks = require('../tasks')

tasks.setKeyPrefix('dbj-cron-update-')

var oneday = 60 * 60 * 24 * 1000
var oneweek = oneday * 7

function updateAll(query) {
  var now = new Date()
  var canExit = true
  var blacklist = []
  var counter = 0

  if (tasks.getQueueLength()) {
    log('There are unfinished task. Exit.')
    return
  }

  cached.get('user_blacklist', function(err, res) {
    if (res && res.length) {
      blacklist = res
    }
  })

  User.stream(query, { limit: null }, function(stream) {
    function done(e) {
      if (e) {
        log('Sync and compute error: %s', e)
      }
      if (canExit) {
        log('==== Updated %s users, exit. ======', counter)
        process.exit()
      }
    }
    function resume() {
      if (tasks.getQueueLength() < 4) {
        stream.resume()
      } else {
        log('[warning] Too many tasks running, wait next..')
      }
    }
    stream.on('data', function(u) {
      if (~blacklist.indexOf(u._id)) {
        return resume()
      }
      canExit = false
      stream.pause()
      counter += 1
      u.pull(function() {
        resume()
        tasks.interest.collect_book({
          user: u,
          force: true,
          fresh: false
        })
        u.once('computed', function(e) {
          resume()
          done(e)
        })
      })
      log('Queue user %s [%s]', u.uid, u.name)
    })
    stream.on('end', function() {
      log('===== Stream ended. %s users in queue. =====', counter)
      canExit = true
      if (counter === 0) {
        done()
      }
    })
  })
}

setTimeout(updateAll, 1000, {
  last_synced_status: {
    $ne: 'ing'
  },
  book_n: {
    $gt: 500
  },
  // 一周之内更新过的用户就不再更新
  last_synced: {
    $lt: new Date(new Date() - oneweek)
  },
})
