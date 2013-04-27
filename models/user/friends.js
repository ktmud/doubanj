var debug = require('debug');
var util = require('util');
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

    var start = query.start || 0;
    var limit = query.limit || 20;

    if (!ids || typeof ids !== 'object') {
      ids = {};
    }

    var ending = start + limit;

    function end(_ids) {
      _ids = _ids.slice(start, ending);
      cb(null, _ids);
    }

    // there's enough ids in local cache.
    var _ids = Object.keys(ids);
    if (_ids.length >= ending) return end(_ids);

    self.pullFollowings(start, function(err, _ids) {
      if (err) return cb(err);

      central.utils.extend(ids, _ids);

      // save it
      self.data('followings', ids, function(err, r) {
        verbose('Saved pull followings result: %s, %s', err, r);
        end(Object.keys(ids));
      });
      // expire friendships in 30 days.
      self.expire('followings', 30 * ONE_DAY);
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

        var ids = {};

        // save all the users
        ret.forEach(function(item, i) {
          if (item.type !== 'user') return;

          ids[item.id] = 1;
          cls({ _id: item.id }).update({
            name: item.screen_name,
            uid: item.uid,
            loc_name: item.city,
            signature: item.description,
            avatar: item.large_avatar
          });
        });

        cb(err, ids);
      });
  });
};
