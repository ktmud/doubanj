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
    function resume() {
      if (stream.paused) {
        stream.resume()
      }
      if (canExit) {
        log('Done, exit.')
        process.exit()
      }
    }
    stream.on('data', function(doc) {
      if (~blacklist.indexOf(doc._id)) {
        return resume()
      }
      canExit = false
      var u = new User(doc)
      stream.pause()
      u.pull(function() {
        tasks.interest.collect_book({
          user: u,
          force: true,
          fresh: false,
          success: function() {
            log('Callback sussess for user %s [%s].', u.uid, u.name)
            resume()
          },
          error: function() {
            log('Callback error for user %s [%s].', u.uid, u.name)
            resume()
          }
        })
      })
      log('Queue user %s [%s]', u.uid, u.name)
    })
    stream.on('close', function() {
      log('=== Stream closed. ===')
      canExit = true
      resume()
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
