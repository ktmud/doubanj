var debug = require('debug');
var error = debug('dbj:model:error');
var verbose = debug('dbj:model:verbose');
var log = debug('dbj:model:log');

var cwd = process.cwd();
var util = require('util');
var utils = require(cwd + '/lib/utils');
var trunc = utils.trunc;
var extend = utils.extend;

var mongo = require('./pool').instant;

function Model(info) {
  extend(this, info);
  return this;
}
util.inherits(Model, require('events').EventEmitter);

Model.prototype.kind = Model.kind = null;
Model.prototype._collection = Model._collection = null;

Object.defineProperty(Model.prototype, 'id', {
  get: function() {
    return this._id;
  },
  set: function(val) {
    return this._id = val;
  },
  enumerable: false
});

Model.get = function(id, cb) {
  var cls = this;
  var kind = cls.kind;
  verbose('getting %s %s', kind, id)
  mongo(function(db) {
    var collection = db.collection(cls._collection);
    collection.findOne({ _id: id }, function(err, r) {
      if (err !== null) {
        error('get %s failed: %s', kind, err);
        return cb(err);
      }

      if (r) return cb(null,  Interest(r));

      log('%s %s not found', kind, id);

      return cb(null, null);
    });
  });
};

Model._default_sort = { _id: -1 };
Model._default_limit = 20;

Model.find = function(query, opts, cb) {
  var cls = this;

  opts = opts || {};
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  utils.defaults(opts, {
    sort: cls._default_sort,
    limit: cls._default_limit,
  });

  cls.stream(query, opts, function(stream) {
    if (opts.stream) return cb(stream);

    var last_err = null, ret = [];
    stream.on('data', function(item) {
      ret.push(new cls(item));
    });
    stream.once('error', function(err) {
      last_err = err;
      error('getting %s failed: %s', cls.prototype.kind, err);
    });
    stream.once('close', function() {
      verbose('done find: ', query, opts);
      cb(last_err, ret);
    });
  });
};
Model.count = function(query, opts, cb) {
  var cls = this;
  opts = opts || {};
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  mongo(function(db) {
    db.collection(cls._collection).count(query, opts, cb);
  });
};
Model.gets = function(ids, opts, cb) {
  if (typeof ids[0] === 'object') {
    // extract the real id
    ids = ids.map(function(item) {
      return item._id;
    });
  }
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  opts = opts || {};
  opts.limit = ids.length;

  var query = {
    _id: {
      '$in': ids
    },
  };

  return this.find(query, opts, function(err, items) {
    if (err) return cb(err, items);

    if (opts.preserve_order !== false) {
      var order_map = {};
      items.forEach(function(item, i) {
        order_map[item._id] = item;
      });
      items = ids.map(function(id) {
        return order_map[id];
      });
    }
    if (opts.filter_null) {
      items = items.filter(function(item) {
        return item;
      });
    }

    cb(err, items);
  });
};
Model.stream = function(query, opts, cb) {
  var self = this;

  if (typeof opts === 'function') {
    cb = opts;
    opts = undefined;
  }

  if (!cb) return mongo.db.collection(self._collection).find(query, opts).stream();

  mongo(function(db) {
    cb(db.collection(self._collection).find(query, opts).stream());
  });
};

Model.fromJSON = function(json) {
  return this(JSON.parse(json));
}
/**
* currying wrappers
*/
Model.extended = function(fn, opts) {
  var cls = this;
  return function() {
    var args = arguments;
    var callback = args[args.length - 1];
    
    // rewrite callback
    args[args.length - 1] = function(err, ids) {
      if (err) return callback(err);
      cls.gets(ids, opts, callback);
    };
    fn.apply(this, args);
  }
};

/**
* generate a curring function
* to build funtions for
* attach given object based on prop_name
*
* Confusing, eih? :-(
*/
Model.attached = function(prop_name, extend_to, ObjClass) {
  return function(fn) {
    return function() {
      var args = arguments;
      var callback = args[args.length - 1];
      
      // rewrite callback
      args[args.length - 1] = function(err, docs) {
        if (err) return callback(err);

        var is_arr = Array.isArray(docs);

        docs = is_arr ? docs : [docs];

        var oids = {};
        docs.forEach(function(item, i) {
          var oid = item[prop_name];
          if (oid) oids[oid] = i;
        });

        ObjClass.gets(Object.keys(oids), function(err, items) {
          items && items.forEach(function(item, index) {
            if (!item) return;

            var i = oids[item._id];
            // attach it... T.T
            docs[i][extend_to] = ObjClass(item);
          });
          callback(err, docs);
        });
      };

      fn.apply(this, args);
    }
  }
};

// the uid to user decorator
Model.ensured = function(fn) {
  var cls = this;
  var kind = cls.prototype.kind;
  return function() {
    var self = this;

    var args = arguments;
    var uid = args[0];

    if (uid instanceof cls || (uid && uid[kind] instanceof cls)) return fn.apply(self, args);

    if (!kind) throw new Error('Ensured class done have kind');

    if (typeof uid === 'string' || typeof uid === 'number') {
      // fn(12346);
      cls.get(uid, function(err, instan) {
        args[0] = instan;
        fn.apply(self, args);
      });
    } else {
      // some fn like:
      // fn({ user: xxx });
      cls.get(uid[kind], function(err, instan) {
        args[0][kind] = instan;
        fn.apply(self, args);
      });
    }
  };
};


Model.prototype.save = function(cb) {
  var self = this;
  mongo(function(db, next) {
    var collection = db.collection(self._collection); 
    var _id = self._id || self.id;
    if (_id) {
      var obj = self.toObject();
      obj._id = _id;
      collection.save(obj, {
        upsert: true,
      }, function(err, res) {
        if (err) {
          self.emit('error', err);
          error('save %s %s faild: %s', self.kind, self._id, err);
        }
        self.emit('saved', res);
        next();
        cb && cb(err, res);
      });
    } else {
      cb && cb('need id');
    }
  });
};
Model.prototype.update = function(data, cb) {
  var self = this;
  var uid = self.uid || self._id;

  cb = cb || function(){};

  if (typeof data !== 'object') throw new Error('invalid data');

  function do_update(db, next) {
    var collection = db.collection(self._collection);

    var _id = String(self._id || self.id || data._id);

    // remove options
    delete data['$upsert'];
    delete data['_id'];

    data['mtime'] = new Date();

    verbose('Try upsert %s %s...', self.kind, uid); 

    collection.update({
      _id: _id,
    }, {
      $set: data
    }, {
      upsert: true
    }, function(err, r) {
      if (err) error('updating %s %s failed: %s', self.kind, uid, err);

      extend(self, data);

      self.emit('updated', data);

      self.clearCache(function() {
        cb(err, r);
        next();
        verbose('%s %s updated.', self.kind, uid);
      });
    });
  }

  // if not exist, create it
  // if exists, will update the whole doc
  if (data['$upsert'] !== false) return mongo(do_update);

  cb(new Error('missing _id'));
};

Model.prototype.clearCache = function(cb) {
  return cb();
};

Model.prototype.toObject = function() {
  return { '_id': this['_id'], 'kind': this.kind };
};
Model.prototype.toString = function() {
  var obj = this.toObject();
  return JSON.stringify(obj);
};

Model.prototype.getSelector = function() {
  var self = this;
  var selector = [];
  
  if (self._id) {
    selector.push({ _id: self._id });
  }
  if (self.uid) {
    selector.push({ uid: self.uid });
  }

  if (selector.length === 2) {
    return {
      '$or': selector
    };
  }
  return selector[0];
};

module.exports = Model;
