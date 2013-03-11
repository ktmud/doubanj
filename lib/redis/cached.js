var _uuid = 0;
function uniq_id() {
  return ++_uuid;
}

function Cached(client, opts) {
  if (!(this instanceof Cached)) return new Cached(client);
  opts = opts || {};
  this.options = opts;
  this.client = client;
  this.constructors = {};
}
Cached.prototype.register = function() {
  var cons = this.constructors;
  var client = this.client;
  [].map.call(arguments, function(item) {
    //item.prototype._cache_keys = function() {
      //var ret = [this.kind + '-' + this.id];
      //if (this.uid) ret.push(this.kind + '-' + this.uid);
      //return ret;
    //};
    //item.prototype._clear_cache = function(next) {
      //var keys = this._cache_keys();
      //client.del(keys, function(err, r) {
        //next && next();
      //});
    //};
    cons[item.name] = item;
  });
};
Cached.prototype._reg_key = /{([\w]+)}/g;

/**
* generate a valid key based on arguments values
*/
Cached.prototype._applykeys = function applykey(key, self, args) {
  var prefix = this.options.prefix;
  var k = String(prefix + key);
  var ret = [k];

  // substi all value in an array,
  // return a new array
  function substi(arr, p, v) {
    return arr.map(function(item, i) {
      return item.replace(p, v);
    });
  }

  var reg = this._reg_key;
  var m, p0, p1, v, ks, k;
  while(true) {
    m = reg.exec(k);

    if (!m) break;

    p0 = m[0];
    p1 = m[1]

    // dive into object
    ks = p1.split('.');
    k = ks.shift();
    v = k === 'self' ? self : args[k];
    while (v && ks.length && ks[0] in v) {
      v = v[ks.shift()];
    }
    if (Array.isArray(v)) {
      var r = [];
      v.forEach(function(item) {
        r = r.concat(substi(ret, p0, item));
      });
      ret = r;
    } else if (v) {
      ret = substi(ret, p0, v);
    }
  }
  return ret;
}
Cached.prototype._applykey = function applykey(key, self, args) {
  var ks, v, k;
  return key.replace(this._reg_key, function(p0, p1) {
    // dive into object
    ks = p1.split('.');
    v = null;
    k = ks.shift();
    v = k === 'self' ? self : args[k];
    while (v && ks.length && ks[0] in v) {
      v = v[ks.shift()];
    }
    return v || p0;
  });
}

Cached.prototype._cons_id = function cons_id(Constructor) {
  var constructors = this.constructors;
  // identify constructor by it's name and arguments length 
  var cid = Constructor.name;
  if (cid in constructors && constructors[cid] !== Constructor) {
    cid += uniq_id();
  }
  return cid;
}

Cached.prototype._stringify = JSON.stringify;
var reg_time =  /^[0-9\-]+T[0-9\:\.]+Z$/;
Cached.prototype._parse = function(obj) {
  return JSON.parse(obj, function(k, v) {
    if (reg_time.test(v)) {
      return new Date(v);
    }
    return v;
  });
};

/**
* Transform a instance to json object, with constructor info in it
*/
Cached.prototype._tostore = function tostore(obj) {
  var self = this;

  if (Array.isArray(obj)) {
    return self._stringify(obj.map(function(item) {
      return self._tostore(item);
    }));
  }

  var cons = obj.constructor;
  // Some instance provided a customed toObject function
  if (obj.prototype && obj.prototype.hasOwnProperty('toObject')) {
    obj = obj.toObject();
  }
  // none Object (number, string) will be stringified as it is.
  obj.__cons_id__ = this._cons_id(cons);
  return this._stringify(obj);
}

/**
* Transform cached json string to a real instance 
*/
Cached.prototype._toinstance = function toinstance(data) {
  if (data === null || data === undefined) return;

  obj = data;

  var self = this;

  if (obj && typeof obj === 'string') {
    try {
      obj = this._parse(obj);
      var Constructor = obj.__cons_id__ && this.constructors[obj.__cons_id__];
      if (Constructor) return new Constructor(obj);
    } catch (e) {
      console.log(obj);
      console.trace(e);
      // invalid data return a null
      return null;
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(function(item) {
      return self._toinstance(item);
    });
  }

  return obj;
}

/**
* hashset cache wrapper
*/
Cached.prototype.wrap = function(fn, key, maxAge) {
  var client = this.client;
  var cached = this;

  maxAge = maxAge || this.options.ttl;

  return function() {
    var self = this;
    var args = [].slice.apply(arguments);
    var callback = args[args.length - 1];

    if (typeof callback !== 'function') return fn.apply(self, args);

    key = cached._applykey(key, self, args);

    //console.log(key);
    client.get(key, function(err, reply) {
      if (err) console.trace(err);

      //client.del(key);

      //console.log(err, reply);

      reply = cached._toinstance(reply);

      if (reply === undefined) {
        args[args.length -1] = function(err, res) {
          var called = false;

          if (maxAge) {
            // save the return value to cache
            // use multi action
            client.multi().set(key, cached._tostore(res))
            .pexpire(key, maxAge)
            .exec(function() {
              callback.call(self, err, res);
              called = true;
            });
          } else {
            // save the return value to cache
            client.set(key, cached._tostore(res), function() {
              callback.call(self, err, res);
              called = true;
            });
          }

          // redis timeout, continue
          //setTimeout(function() {
            //console.err('Redis timeout... %s', key);
            //if (!called) callback.call(self, err, res);
          //}, cached.options.timeout || 30000);
        };
        fn.apply(self, args);
      } else {
        callback.call(self, err, reply);
      }
    });
  }
};
Cached.prototype.multi = function(fn, key, maxAge) {
  var client = this.client;
  var cached = this;

  maxAge = maxAge || this.options.ttl;

  return function() {
    var self = this;
    var args = [].slice.apply(arguments);
    var callback = args[args.length - 1];

    var arr_index = null;
    args.forEach(function(item, i) {
      if (Array.isArray(item)) arr_index = i;
    });
    if (arr_index === null) throw new Error('There must be an array in multi cached funtion parameters');

    if (typeof callback !== 'function') return fn.apply(self, args);

    var keys = cached._applykeys(key, self, args);

    var called = false;
    var replies;
    function finish(err) {
      callback.call(self, err, replies);
      called = true;
    }

    client.mget(keys, function(err, res) {
      // null results
      var nils = {};

      replies = res.map(function(item) {
        return cached._toinstance(item);
      });

      keys.forEach(function(item, i) {
        if (replies[i] === null) nils[item] = i;
      });

      var nils_keys = Object.keys(nils);
      if (res.length === keys.length && !nils_keys.length) return finish(err);

      args[arr_index] = nils_keys;
      args[args.length -1] = function(err, res) {
        var called = false;

        var kws = [];
        nils_keys.forEach(function(k, i) {
          kws.push(k);
          var item = replies[nils[k]] = res[i];
          kws.push(cached._tostore(item));
        });
        if (maxAge) {
          // save the return value to cache
          client = client.multi().mset(kws);

          nils_keys.forEach(function(item, i) {
            client = client.pexpire(item, maxAge);
          });

          client.exec(function() {
            finish(err);
          });
        } else {
          // save the return value to cache
          client.mset(kws, function() {
            finish(err);
          });
        }

        // redis timeout, continue
        //setTimeout(function() {
          //if (!called) callback.call(self, err, res);
        //}, 30000);
      };
      fn.apply(self, args);
    });
  }
};

module.exports = Cached;
