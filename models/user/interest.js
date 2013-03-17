var Interest = require('../interest');

//var redis = central.redis;

function sorted_list(ns, k, sort) {
  var list = Interest[ns][ns + '_attached'](function(status, limit, cb) {
    if (typeof limit == 'function') {
      cb = limit;
      limit = 20;
    }

    var user = this;
    var uid = user._id;
    var query = {};
    if (status !== 'all') query = { status: status };
    Interest[ns].findByUser(uid, {
      query: query,
      sort: sort,
      limit: limit
    }, cb);
  });

  return list;
}

// Please make sure these keys are in indexes, see `database/index.js`
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
