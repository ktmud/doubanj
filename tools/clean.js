#!/usr/bin/env node

/**
 * clean all redis stats cache for users
 */
var log = require('debug')('dbj:tool:update');

var User = require('../models/user');

var oneday = 60 * 60 * 24 * 1000;
var oneweek = oneday * 7;

function updateAll() {
  var now = new Date();

  User.stream({
    stats_p: 100
  }, { limit: null }, function(stream) {
    stream.on('data', function(doc) {
      var u = new User(doc);
      log('Deleting stats cache for [%s]', u.name);
      u._del_data('book_stats');
    });
    stream.on('end', function() {
      log('=== Stream ended. ===');
      setTimeout(process.exit, 200);
    });
  });
}

setTimeout(updateAll, 2000);
