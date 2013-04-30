var debug = require('debug');
var async = require('async');
var util = require('util');
var lodash = require('lodash');

var verbose = debug('dbj:user:friends:verbose');
var log = debug('dbj:user:friends:info');
var error = debug('dbj:user:friends:error');

var central = require('../../lib/central');

var cwd = central.cwd;
var conf = central.conf;
var redis = central.redis;
var mongo = central.mongo;
var task = central.task;

var consts = require('../consts');

var ONE_DAY = 60 * 60 * 24 * 100;


/**
 * Get following friends from redis cache
 */
exports.listFollowings = function(query, cb) {
  var self = this;
  self.data('followings', function(err, ids) {
    if (err) {
      error('get followings from redis failed: %s', err);
      return cb(err);
    }

    var start = parseInt(query.start, 10) || 0;
    var limit = parseInt(query.limit, 10) || 20;

    if (!Array.isArray(ids)) {
      ids = [];
    }

    var ending = start + limit;

    function end(_ids) {
      _ids = _ids.slice(start, ending);
      cb(null, _ids);
    }

    // there's enough ids in local cache.
    if (ids.length >= ending) return end(ids);

    self.data('following_sites', function(err, sites) {
      var _start = ids.length;
      if (sites && typeof sites === 'object') {
        _start += Object.keys(sites).length;
      }
      log('Pulling followings for [%s] from: %s (current: %s)', self.uid, _start, start);
      self.pullFollowings(_start, function(err, _ids) {
        if (err) return cb(err);

        ids = lodash.union(ids, _ids);

        // save it
        self.data('followings', ids, function(err, r) {
          verbose('Save pulled followings: (%s, %s)', err, r);
          end(ids);
        });
        // expire friendships in 30 days.
        self.expire('followings', 30 * ONE_DAY);
      });
    });
  });
};

/**
 * Get following friends list from douban
 */
exports.pullFollowings = function(start, cb) {
  var self = this;
  var cls = self.constructor;

  verbose('Pulling followings for %s..', self.name);

  task.api2(function(oauth2, next) {
    var uid = self.id || self.uid;
    oauth2.clientFromToken(self.douban_token).request(
      'GET', '/shuo/v2/users/' + uid + '/following',
      {
        start: start || 0,
        count: 200 // 豆瓣API允许的最大值即为200
      }, function(err, ret) {

        // release task client
        setTimeout(next, oauth2.req_delay || 0);

        if (err) return cb(err);

        var ids = [], sites = {};

        // save all the users
        async.each(ret, function(item, callback) {
          if (item.type !== 'user') {
            verbose('Skipping none-user %s...', item.screen_name);
            sites[item.id] = item.original_site_id;
            return callback();
          }

          ids.push(item.id);

          cls({ _id: item.id }).update({
            name: item.screen_name,
            uid: item.uid,
            created: new Date(item.created_at),
            loc_name: item.city,
            signature: item.description,
            avatar: item.small_avatar
          }, callback);
        }, function(err) {
          self.data('following_sites', sites, function(err, r) {
            verbose('Save pulled followings sites: (%s, %s)', err, r);
            cb(err, ids);
          });
          self.expire('following_sites', 30 * ONE_DAY);
        });

      });
  });
};
