module.exports = User
module.exports.User = User

var debug = require('debug')
var async = require('async')
var util = require('util')
var verbose = debug('dbj:user:verbose')
var log = debug('dbj:user:info')
var error = debug('dbj:user:error')

var central = require('../../lib/central')

var cwd = central.cwd
var conf = central.conf
var redis = central.redis
var mongo = central.mongo
var utils = central.utils
var task = central.task

var consts = require('../consts')

var INTEREST_STATUSES = consts.INTEREST_STATUSES
var USER_COLLECTION = consts.USER_COLLECTION

function User(info) {
  if (!(this instanceof User)) return new User(info)

  utils.extend(this, info)

  central.DOUBAN_APPS.forEach(function(ns) {
    this[ns + '_n'] = this[ns + '_n'] || 0
  })

  delete this['__cons_id__']

  return this
}

util.inherits(User, mongo.Model)
utils.extend(User, mongo.Model)

User.prototype.kind = User.prototype._collection = User._collection = User.kind = USER_COLLECTION

User._gets = User.gets

User.gets = function(ids, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  var filter_null = options.filter_null
  if (filter_null) {
    delete options.filter_null
  }
  async.map(ids, function(id, callback) {
    User.get(id, options, callback)
  }, function(err, ret) {
    if (ret && filter_null) {
      ret = ret.filter(function(item) { return item });
    }
    cb(err, ret)
  })
}

/**
* Get user from database
*/
User.getFromMongo = function(uid, options, cb) {
  if (uid instanceof User) return cb(null, uid)

  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  uid = String(uid).toLowerCase()

  mongo(function(db) {
    var collection = db.collection(USER_COLLECTION)
    var query = isdigit(uid) ? { _id: uid } : { uid: uid }
    collection.findOne(query, options, function(err, r) {
      if (err) {
        error('get user from mongo failed: %s', err)
        return cb(err)
      }

      if (r) return cb(null, User(r))

      return cb(null, null)
    })
  })
}
// User as an available constructor
redis.cached.register(User)

function isdigit(num) {
  return !isNaN(Number(num))
}

/**
* Get the latest synced users
*/
User.latestSynced = function(cb) {
  var cls = this
  mongo(function(db) {
    var collection = db.collection(USER_COLLECTION)
    collection.find({
      stats_p: 100
    }, {
      sort: {
        last_statsed: -1
      },
      fields: {
        _id: 1,
        name: 1,
        last_synced: 1
      },
      limit: 30,
    }).toArray(function(err, ret) {
      var users = ret && ret.map(function(item) {
        return cls(item)
      })
      if (err) error(err)
      return cb(err, users)
    })
  })
}
/**
* cache the result in redis for 60 seconds
*/
User.latestSynced = redis.cached.wrap(User.latestSynced, 'latest-synced', 60000)

/**
* Count users wish results
*/
User.count = function(cb) {
  mongo(function(db) {
    var collection = db.collection(USER_COLLECTION)
    collection.count({ last_statsed: { $lt: new Date() } }, cb)
  })
}
//User.count = redis.cached.wrap(User.count, 'users-count', 60000)

var reg_valid_uid = /^[\w\.\_\-]+$/
User.get = function(uid, options, cb) {
  if (uid instanceof User) return cb(null, uid)

  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  if (uid && typeof uid === 'object' && '_id' in uid) {
    uid = uid._id
  }

  if (!uid) return cb(null, null)

  uid = String(uid).toLowerCase()

  verbose('getting user %s...', uid)

  if (!reg_valid_uid.test(uid)) {
    return cb(null, null)
  }

  User.getFromMongo(uid, options, function(err, u) {
    if (err) return cb(err)
    // got a 404
    if (!u) {
      // try get user info from
      var info = parseInt(uid) ? { '_id': uid } : { uid: uid }
      u = User(info)
    }
    // haven't got douban account info yet
    if (!u.name) {
      u.pull(function(err) {
        if (err && err.statusCode == 404) {
          return cb(null, null)
        }
        return cb(err, u)
      })
      return
    }
    return cb(null, u)
  })
}
//User.get = redis.cached.wrap(User.get, 'user-{0}')
User.prototype.clearCache = function(next) {
  return next()

  var n = 1
  if (this.uid && this.uid !== this._id) {
    n += 1
    redis.clear('user-' + this.uid, tick)
  }

  redis.clear('user-' + this._id, tick)

  var called = false
  function tick() {
    n -= 1
    if (called) return
    if (n <= 0) {
      called = true
      return next()
    }
  }
}

var pull_queue = {}
/**
* pull from douban api, get account info
*/
User.prototype.pull = function(cb) {
  var self = this
  var uid = self.uid || self._id

  if (!reg_valid_uid.test(uid)) return cb(404)

  if (uid in pull_queue) {
    var err = new Error('pulling')
    err.n = pull_queue[uid]
    return cb(err)
  }

  pull_queue[uid] = Object.keys(pull_queue).length

  function done() {
    log('Pulled user %s', uid)
    delete pull_queue[uid]
    try {
      clearTimeout(t)
    } catch (e) {}
  }

  // time out for unfinished socket request
  var t = setTimeout(done, 300000)

  log('Queue pull user %s ...', uid)
  task.api2(function(oauth2, next) {
    oauth2.clientFromToken().request('GET', '/v2/user/' + uid, function(err, data) {
      done()

      setTimeout(next, oauth2.req_delay || 0)

      if (err) {
        error('get douban info for %s failed: %s', uid, JSON.stringify(err))
        // no such user in douban
        if (err.statusCode == 404) {
          self.invalid = 'NO_USER'
        }
        return cb && cb(err)
      }

      self.merge(data, cb)
    })
  })
}
User.prototype.merge = function(data, cb) {
  verbose('Merge douban account data for [%s]..', data.name)

  if (data.uid) {
    data.uid = String(data.uid).toLowerCase()
  }
  if (typeof data.created === 'string') {
    data.created = new Date(data.created)
  }
  data._id = data.id
  delete data.id

  var self = this
  // save douban account info
  self.update(data, function(err, r) {
    cb && cb(err, self)
  })
}

/**
* TODO: login in doubanj.com
*/
User.getByPasswd = function(uid, password, cb) {
  if (!uid || !password) return cb(401)
  User.getFromMongo(uid, function(err, user) {
    if (err) return cb(err)
    if (!user) return cb(404)
    if (user.validPassword(password)) return cb(null, user)
    return cb(403)
  })
}
User.prototype.validPassword = function() {
}


User.prototype.toObject = function() {
  var now = new Date()
  return {
    // douban account
    //'id': this['id'],
    'alt': this['alt'],
    'uid': this['uid'] || this.id,
    'created': this['created'],
    'avatar': this['avatar'],
    'desc': this['desc'],
    'loc_id': this['loc_id'],
    'loc_name': this['loc_name'],
    'signature': this['signature'],

    'invalid': this['invalid'] || null,

    // local props
    '_id': this['_id'],
    'ctime': this['ctime'] || now,
    'mtime': this['mtime'],
    'last_synced': this.last_synced,
    'last_synced_status': this.last_synced_status,
    'last_statsed': this.last_statsed,
    'stats': this.stats,
    'stats_status': this.stats_status,
    'stats_p': this.stats_p, // stats percentage
    'stats_fail': this.stats_fail,
    'book_stats': this.book_stats,
    'book_n': this.book_n,
    'book_synced_n': this.book_synced_n,
    'book_last_synced': this.book_last_synced,
    'book_last_synced_status': this.book_last_synced_status,
    'movie_n': this.movie_n || 0,
    'movie_last_synced': this.movie_last_synced,
    'atime': now
  }
}

User.prototype.url = function() {
  return [conf.site_root, 'people', this.uid || this._id].join('/') + '/'
}
/**
* Douban url
*/
User.prototype.db_url = function(ns) {
  ns = ns || 'www'
  return 'http://' + ns + '.douban.com/people/' + (this.uid || this._id) + '/'
}

User.prototype.interests = function(ns, cb) {
  return Interest[ns].findByUser(this.uid || this._id, cb)
}


var statuses = ['wish', 'ing', 'done']

statuses.forEach(function(st) {
  User.prototype[st + 's'] = function(ns, cb) {
    var self = this
    self.interests(ns, function(err, items) {
      if (err) cb(err, [])
      items = items.filter(function(item) {
        return item.status === INTEREST_STATUSES[ns][st]
      })
      cb(null, items)
    })
  }
})


/**
* output stats as csv
*/
require('./stats')

/**
* calculate syncing stage
*/
require('./progress')

/**
* predefined interests collection
*/
require('./interest')

/**
 * Clicks with other people
 */
require('./click')

/**
 * get friends
 */
require('./friends')

User.prototype.listFollowings = User.extended(User.prototype.listFollowings, {
  fields: { uid: 1, avatar: 1, name: 1, stats_p: 1, last_synced_status: 1 }
})


/**
 * redis data set/get mixin
 */
utils.extend(User.prototype, require('../mixins/data'))

