var central = require('../../lib/central');

var redis = central.redis;

/**
 * format a cache key
 */
exports.cache_key = function(key) {
  var ret = ['dbj', this.kind, this.id];
  if (key) ret.push(key);
  return ret.join(':');
};

/**
 * Get or set a redis-stored data 
 */
exports.data = function(key, val, cb) {
  if (typeof val === 'function') return this._get_data(key, val);
  return this._set_data(key, val, cb);
};

exports._get_data = function(key, cb) {
  var key = this.cache_key(key);
  redis.client.get(key, function(err, buf) {
    try {
      if (buf) {
        buf = JSON.parse(buf);
      }
    } catch (e) {
      buf = null;
    }
    return cb(err, buf);
  });
};
exports._set_data = function(key, val, cb) {
  key = this.cache_key(key);
  val = JSON.stringify(val);
  redis.client.set(key, val, cb);
};

exports.expire = function(key, milliseconds, cb) {
  redis.client.pexpire(this.cache_key(key), milliseconds, cb);
};
