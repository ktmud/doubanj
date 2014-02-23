var Interest = require('../interest')
var User = require('./index')
var namespaces = ['book']

//var redis = central.redis

function sorted_list(ns, k, sort) {
  var list = Interest[ns][ns + '_attached'](function(opts, cb) {
    if (typeof opts == 'function') {
      cb = opts
      opts = {}
    }

    var user = this
    var uid = user._id
    var query = opts.query || {}
    if (opts.status && opts.status !== 'all') {
      query.status = opts.status
    }
    Interest[ns].findByUser(uid, {
      query: query,
      sort: sort,
      limit: opts.limit || 30,
      skip: opts.start || 0,
    }, cb)
  })

  return list
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
}

namespaces.forEach(function(ns, i) {
  for (var k in sorts) {
    User.prototype[ns + '_' + k] = sorted_list(ns, k, sorts[k])
  }
})
