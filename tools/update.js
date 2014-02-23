#!/usr/bin/env node

/**
 * Update all users in background.
 */
var log = require('debug')('dbj:tool:update');

var User = require('../models/user');
var tasks = require('../tasks');

tasks.setKeyPrefix('dbj-cron-update-');

var oneday = 60 * 60 * 24 * 1000;
var oneweek = oneday * 7;

function updateAll(query) {
  var now = new Date();

  if (tatks.getQueueLength()) {
    log('There are unfinished task. Exit.');
    return;
  }

  User.stream(query, { limit: null }, function(stream) {
    stream.on('data', function(doc) {
      var u = new User(doc);

      stream.pause();

      u.pull(function() {
        tasks.interest.collect_book({
          user: u,
          force: true,
          fresh: false,
          success: function() {
            log('Callback sussess for user %s [%s].', u.uid, u.name);
            if (stream.paused) {
              stream.resume();
            }
          },
          error: function() {
            log('Callback error for user %s [%s].', u.uid, u.name);
            if (stream.paused) {
              stream.resume();
            }
          }
        });
      });
      log('Queue user %s [%s]', u.uid, u.name);
    });
    stream.on('close', function() {
      log('=== Stream closed. ===');
      setTimeout(process.exit, 120000);
    });
  });
}

setTimeout(updateAll, 2000, {
  last_synced_status: {
    $ne: 'ing'
  },
  book_n: {
    $gt: 100
  },
  // 一周之内更新过的用户就不再更新
  last_synced: {
    $lt: new Date(new Date() - oneweek)
  },
});
