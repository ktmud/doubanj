var debug = require('debug');
var util = require('util');
var log = debug('dbj:user:info');
var error = debug('dbj:user:error');

var cwd = central.cwd;
var conf = central.conf;
var task = central.task;

var mongo = require(cwd + '/lib/mongo');
var utils = require(cwd + '/lib/utils');

var APP_DATA_DEFAULT = {
  n_interest: 0
};
var USER_COLLECTION = 'user';

function User(info) {
  if (!(this instanceof User)) return new User(info);

  utils.extend(this, info);

  central.DOUBAN_APPS.forEach(function(ns) {
    this[ns + '_n'] = this[ns + '_n'] || 0;
  });
  return this;
};

util.inherits(User, mongo.Model);

User.prototype.kind = User.prototype._collection = USER_COLLECTION;

User.get = function(uid, cb) {
  log('getting user obj for %s', uid)
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
      if (err !== null) {
        log('get user failed: %s', err);
        return cb(err);
      }

      if (r) return cb(null, User(r));

      log('user %s not found', uid);

      var info = parseInt(uid) ? { 'id': uid } : { uid: uid };
      var u = User(info);
      return cb(null, u);
    });
  }, 0);
};


User.prototype.toObject = function() {
  var now = new Date();
  return {
    '_id': this['_id'],
    'id': this['id'],
    'uid': this['uid'],
    'ctime': this['ctime'] || now,
    'book_n': this.book_n || 0,
    'book_last_synced': this.book_last_synced,
    'movie_n': this.movie_n || 0,
    'movie_last_synced': this.movie_last_synced,
    'atime': now
  };
};

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
  return [conf.site_root, this.kind, this.id].join('/');
};

var INTEREST_STATUSES =　{
  book: {
    wish: 'wish',
    ing: 'do',
    done: 'read'
  }
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
module.exports.User = User;
