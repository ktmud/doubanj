var redis = central.redis;
var User = require('./index')

// 过期时间，单位 秒
var CLICK_EXPIRES = 60 * 60 * 12;

if (central.conf.debug) {
  CLICK_EXPIRES = 30;
}

var grades = {
  0: '话不投机',
  100: '形同陌路',
  300: '貌合神离',
  600: '志同道合',
  800: '情投意合',
  1200: '情同手足',
  1600: '心有灵犀',
  2000: '同甘共苦',
  3000: '生死与共',
};


/**
 * progress of calculating click
 */
User.prototype.clickProgress = function(other, cb) {
  if (!(other instanceof this.constructor)) return null;
  this.getClick(other, function(err, r) {
    if (err) return cb(err);
    if (!r) return cb(null, 0);
    return cb(null, r.p);
  });
};

/**
 * return a click grading text
 */
User.prototype.clickGrade = function(num) {
  num = parseInt(num);
  for (var k in grades) {
    if (parseInt(k) < num) continue;
    return grades[k];
  }
  return '爆表';
};

function swap(obj, a, b) {
  var tmp1 = obj[a], tmp2 = obj[b];
  obj[b] = tmp1;
  obj[a] = tmp2;
}

/**
 * Get click for the other one
 */
User.prototype.getClick = function(other, cb) {
  var self = this;
  redis.client.get(self._clickKey(other), function(err, ret) {
    try {
      ret = JSON.parse(ret);
    } catch (e) {}
    //ret = null;
    if (!err && ret && typeof ret.ratios === 'object') {
      // 这种比较与计算结果时的 sort 一致
      if (self.id > other.id) {
        swap(ret, 'love_hate', 'hate_love');
        swap(ret, 'done_wish', 'wish_done');
        for (var k in ret.ratios) {
          swap(ret.ratios[k], 0, 1);
        }
      }
      ret.score = ret.score || ret.index || '0';
    }
    return cb(err, ret);
  });
};
User.prototype.setClick = function(other, val, cb) {
  var self = this;
  var key = self._clickKey(other);
  redis.client.set(key, JSON.stringify(val), cb);
  redis.client.expire(key, val && val.expires_in || CLICK_EXPIRES);
};
User.prototype.click_url = function(other, tail) {
  var other_uid = typeof other !== 'object' ? other : (other.uid || other.id);
  return this.url() + 'click/' + other_uid + (tail || '');
};

User.prototype._clickKey = function(other) {
  // key 只需保证唯一，先后顺序其实并不重要
  return 'click_' + [this.id, other.id].sort().join('_');
};
