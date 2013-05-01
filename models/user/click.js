var redis = central.redis;

// 过期时间，单位 秒
var CLICK_EXPIRES = 60 * 60 * 6;

if (central.conf.debug) {
  CLICK_EXPIRES = 20;
}

var grades = {
  0: '话不投机',
  100: '形同陌路',
  300: '貌合神离',
  500: '志同道合',
  800: '情投意合',
  1000: '情同手足',
  1500: '心有灵犀',
  2000: '生死与共',
};


/**
 * progress of calculating click
 */
exports.clickProgress = function(other, cb) {
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
exports.clickGrade = function(num) {
  num = parseInt(num);
  for (var k in grades) {
    if (parseInt(k) < num) continue;
    return grades[k];
  }
};

function swap(obj, a, b) {
  var tmp1 = obj[a], tmp2 = obj[b];
  obj[b] = tmp1;
  obj[a] = tmp2;
}

/**
 * Get click for the other one
 */
exports.getClick = function(other, cb) {
  var self = this;
  redis.client.get(self._clickKey(other), function(err, ret) {
    try {
      ret = JSON.parse(ret);
    } catch (e) {}
    //ret = null;
    if (!err && ret && typeof ret.ratios === 'object') {
      // 需要交换值
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
exports.setClick = function(other, val, cb) {
  var self = this;
  var key = self._clickKey(other);
  redis.client.set(key, JSON.stringify(val), cb);
  redis.client.expire(key, CLICK_EXPIRES);
};

exports._clickKey = function(other) {
  return 'click_' + [this.id, other.id].sort().join('_');
};
