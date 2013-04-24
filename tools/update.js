#!/usr/bin/env node

/**
 * Update all users in background.
 */
var log = require('debug')('dbj:tool:update');

var User = require('../models/user');
var tasks = require('../tasks');

var oneday = 60 * 60 * 24 * 1000;

function updateAll() {
  var now = new Date();

  if (tasks.interest.queue.queue.length) {
    log('There are unfinished task. Exit.');
    return;
  }

  User.stream(null, { limit: null }, function(stream) {
    stream.on('data', function(doc) {
      var u = new User(doc);

      // 一周之内更新过的用户就不再更新
      if (u.last_synced_status === 'ing' || now - u.last_synced < oneday * 7) {
          log('Skipping %s...', u.name);
          return;
      }

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

setTimeout(updateAll, 2000);
