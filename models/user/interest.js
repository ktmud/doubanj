var Interest = require('../interest');

//var redis = central.redis;

function sorted_list(ns, k, sort) {

  var list = Interest[ns][ns + '_attached'](function(status, limit, cb) {
    if (typeof limit == 'function') {
      cb = limit;
      limit = 20;
    }

    var user = this;
    var uid = user.uid || user.id;
    var query = {};
    if (status !== 'all') query = { status: status };
    Interest[ns].findByUser(uid, {
      query: query,
      // in order to use redis cache, we only want ids
      sort: sort,
      limit: limit
    }, cb);
  });

  // 用 redis 缓存一下平均能快 50ms 左右
  //list = redis.cached.wrap(list, ['user', '{self.id}', ns, k, '{0}', '{1}'].join('-'));

  return list;
  //var cached = redis.cached.wrap(list, 'user-{self.uid}-' + ns + '-most_commented-{0}');

  //return function(status, limit, cb) {
    //// Isn't this ugly?
    //list.call(this, status, function(err, ret) {
      //console.log(err, ret);
      //if (err || !ret) return cb(err, []);
      //Interest[ns].gets(ret.slice(0, limit), cb);
    //});
  //}
}

var sorts = {
  'most_commented': {
     commented: -1
  },
  'latest': {
     updated: -1
  },
  'highest_ratings': {
     'rating.value': -1
  }
};

['book'].forEach(function(ns, i) {
  for (var k in sorts) {
    exports[ns + '_' + k] = sorted_list(ns, k, sorts[k]);
  }
});
