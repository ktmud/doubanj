var debug = require('debug');
var util = require('util');
var log = debug('dbj:user:info');
var error = debug('dbj:user:error');

var cwd = central.cwd;
var conf = central.conf;
var task = central.task;

var mongo = require(cwd + '/lib/mongo');
var utils = require(cwd + '/lib/utils');
var task = require(cwd + '/lib/task');

var consts = require('../consts');

var INTEREST_STATUSES = consts.INTEREST_STATUSES;
var USER_COLLECTION = consts.USER_COLLECTION;

function User(info) {
  if (!(this instanceof User)) return new User(info);

  utils.extend(this, info);

  central.DOUBAN_APPS.forEach(function(ns) {
    this[ns + '_n'] = this[ns + '_n'] || 0;
  });
  return this;
};

util.inherits(User, mongo.Model);

utils.extend(User.prototype, require('./stats'));

User.prototype.kind = User.prototype._collection = USER_COLLECTION;

User.getFromMongo = function(uid, cb) {
  if (uid instanceof User) return cb(null, uid);
  log('getting user obj for %s', uid)

  uid = String(uid).toLowerCase();

  mongo(function(db) {
    var collection = db.collection(USER_COLLECTION);
    collection.findOne({
      '$or': [
        // douban's uid
        { 'uid': uid },
        // douban id
        { 'id': uid },
        // local id
        { '_id': uid }
      ]
    }, function(err, r) {
      if (err) {
        error('get user from mongo failed: %s', err);
        return cb(err);
      }

      if (r) return cb(null, User(r));

      log('user %s not found', uid);

      return cb(null, null);
    });
  });
};
User.get = function(uid, cb) {
  uid = String(uid).toLowerCase();

  User.getFromMongo(uid, function(err, u) {
    if (err) return cb(err);
    // got a 404
    if (!u) {
      // try get user info from 
      var info = parseInt(uid) ? { 'id': uid } : { uid: uid };
      u = User(info);
    }
    // haven't got douban account info yet
    if (!u.name) {
      u.pull(cb);
      return;
    }
    return cb(null, u);
  });
};

// pull from douban api, get account info
User.prototype.pull = function(cb) {
  var self = this;
  var uid = self.uid || self.id;
  task.api(function(oauth2) {
    oauth2.clientFromToken().request('GET', '/v2/user/' + uid, function(err, data) {
      if (err) {
        error('get douban info for %s failed: %s', uid, JSON.stringify(err));
        // no such user in douban
        if (err.statusCode == 404) {
          self.invalid = 'NO_USER';
        }
        return cb(err);
      }
      if (data.uid) {
        data.uid = String(data.uid).toLowerCase();
      }
      data['$upsert'] = true;
      data.created = new Date(data.created);
      // save douban account info
      self.update(data, function(err, doc) {
        if (err) {
          error('save user %s douban info failed: %s', uid, err);
          self.invalid = 1;
        }
        cb(err, self);
      });
    });
  }, 0);
};


User.prototype.toObject = function() {
  var now = new Date();
  return {
    // douban account
    'id': this['id'],
    'alt': this['alt'],
    'uid': this['uid'],
    'created': this['created'],
    'avatar': this['avatar'],
    'desc': this['desc'],
    'loc_id': this['loc_id'],
    'loc_name': this['loc_name'],
    'signature': this['signature'],

    // local props
    '_id': this['_id'],
    'ctime': this['ctime'] || now,
    'last_synced': this.last_synced,
    'last_synced_status': this.last_synced_status,
    'stats': this.stats,
    'stats_status': this.stats_status,
    'stats_p': this.stats_p, // stats percentage
    'stats_fail': this.stats_fail,
    'book_stats': this.book_stats,
    'book_n': this.book_n || 0,
    'book_synced_n': this.book_synced_n || 0,
    'book_last_synced': this.book_last_synced,
    'book_last_synced_status': this.book_last_synced_status,
    'movie_n': this.movie_n || 0,
    'movie_last_synced': this.movie_last_synced,
    'atime': now
  };
};

// the percentage of generating progress
User.prototype.progress = function() {
  var ps = this.progresses();
  var n = 0;
  ps.forEach(function(item) {
    n += item;
  });
  return n;
};
User.prototype.progresses = function() {
  var ps = [0, 0];
  var user = this;
  // got douban account info
  if (user.created) ps[0] = 5;
  // starting to sync
  if (user.last_synced) ps[0] = 10;
  if (user.book_n === 0) {
    ps[0] = 80;
  } else if (user.book_synced_n) {
    // only book for now
    ps[0] = 5 + (user.book_synced_n / user.book_n) * 75;
  }
  // 20% percent is for computing
  ps[1] = ps[0] >= 80 ? (user.stats_p || 0) * 0.2 : 0;
  return ps;
};

/**
* To prepare stats csv
*/

Object.defineProperty(User.prototype, 'is', {
  get: function() {
    return function(role) {
      var roles = this.roles || [];
      // admin is everything...
      return ~roles.indexOf(role) || ~roles.indexOf('admin');
    };
  },
  enumerable: false
});

Object.defineProperty(User.prototype, 'isAdmin', {
  get: function() {
    return this.is('admin');
  },
  enumerable: false
});

User.prototype.url = function() {
  return [conf.site_root, this.kind, this.uid || this.id].join('/') + '/';
};
User.prototype.db_url = function(ns) {
  ns = ns || 'www';
  return 'http://' + ns + '.douban.com/people/' + (this.uid || this.id) + '/';
};

User.prototype.interests = function(ns, cb) {
  return Interest.findByUser(ns, this.uid, cb);
};
['wish', 'ing', 'done'].forEach(function(st) {
  User.prototype[st + 's'] = function(ns, cb) {
    var self = this;
    self.interests(ns, function(err, items) {
      if (err) cb(err, []);
      items = items.filter(function(item) {
        return item.status === INTEREST_STATUSES[ns][st];
      });
      cb(null, items);
    });
  };
});
User.prototype.wishes = User.prototype.wishs;

module.exports = function(uid) {
  return new User(uid);
};
// the uid to user decorator
module.exports.ensured = function(fn) {
  var self = this;
  return function() {
    var args = arguments;
    var uid = args[0];

    if (uid instanceof User || (uid && uid.user instanceof User)) return fn.apply(self, args);

    if (typeof uid === 'string' || typeof uid === 'number') {
      // fn(12346);
      User.get(uid, function(err, user) {
        args[0] = user;
        fn.apply(self, args);
      });
    } else {
      // some fn like:
      // fn({ user: xxx });
      User.get(uid.user, function(err, user) {
        args[0].user = user;
        fn.apply(self, args);
      });
    }
  };
};
module.exports.User = User;
