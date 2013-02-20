/*
* aggregate user subject collections (called "interest") 
*/
var debug = require('debug');
var log = debug('dbj:task:interest:info');
var error = debug('dbj:task:interest:error');

var task = central.task;
var request = central.request;
var mongo = central.mongo;
var douban_key = central.conf.douban.key;

var User = require(central.cwd + '/models/user').User;

// request stream
function FetchStream(arg, oauth2) {
  this.ns = arg.ns;
  this.user = arg.user;
  this.perpage = arg.perpage || 100;
  this.total = 0;
  this.fetched = 0;
  this.status = 'ready';

  // TODO: use oauth2 client to request,
  // so we can collect private interests
  this.oauth2 = oauth2;

  this.api_uri = 'https://api.douban.com/v2/' + arg.ns + '/user/' + arg.user.uid + '/collections';
  return this;
}

var util = require('util');

util.inherits(FetchStream, require('events').EventEmitter);
//util.inherits(FetchStream, require('stream').Stream);


// starting to collect...
FetchStream.prototype.run = function() {
  var self = this;

  log('starting...');
  self.status = 'running';

  // clear first
  mongo(function(db, next) {
    // remove user's all interests
    var selector;
    if (self.user.id) {
      selector = { user_id: self.user.id };
    } else {
      selector = { uid: self.user.uid };
    }
    log('cleaning old interests...');
    db.collection(self.ns + '_interest').remove(selector, function(err, r) {
      next();
      self.fetch(0, self._fetch_cb());
    });
  });
};

// fetch page by page
FetchStream.prototype._fetch_cb = function() {
  var self = this;
  return function(err, data) {
    if (err) return self.emit('error', err);

    var total = data.total;

    // no data
    if (!total) return self.end();

    if (self.total && total != self.total) {
      self.total = total;
      log('total number changed');
      // total changed during fetching, run again
      return self.run();
    };

    self.total = total;
    self.fetched += data.count;

    if (self.fetched >= total) {
      log('fetching reached end.');
      self.status = 'succeed';
      self.end();
    } else {
      self.fetch(self.fetched, self._fetch_cb());
    }
  };
};
// fetch one page of data
FetchStream.prototype.fetch = function(start, cb) {
  var self = this;

  log('fetching %s~%s...', start, start + self.perpage);

  request.get({
    uri: self.api_uri,
    qs: {
      client_id: douban_key,
      count: self.perpage,
      start: start
    }
  }, function(err, res, body) {
    if (err) return self.emit('error', err);

    if (res.statusCode != 200) {
      return self.emit('error', new Error('douban api response with ' + res.statusCode)); 
    }

    var data;

    try {
      data = JSON.parse(body);
    } catch (e) {
      return self.emit('error', new Error('parse api response failed: ' + body)); 
    }

    self.write(data, cb);
  });
};

// TODO: cache data locally first, wait for some time, then commit to database
FetchStream.prototype.write = function saveInterest(data, cb) {
  var ns = this.ns
    , self = this
    , uid = self.user.uid || self.user.id
    , total = data.total
    , items = data.collections
    , subjects = [];

  // pick up subjects
  items.forEach(function(item, i) {
    var s = item[ns];
    item['uid'] = uid;
    delete item[ns];
    subjects.push(s);
  });

  // `next` is to release db client lock
  mongo(function(db, next) {
    var save_options = { w: 1, continueOnError: 1 };

    // save user interest
    log('saving interests...');
    db.collection(ns + '_interest').insert(items, save_options, function(err, r) {
      if (err) {
        if (cb) cb(err);
        return next();
      }
      // save subjects
      log('saving subjects...');
      var col_s = db.collection(ns);

      //col_s.insert(subjects, { continueOnError: true }, function(err, res) {
        //log('saving complete.');
        //cb && cb(null, data);
        //next();
      //});
      function save_subject(i) {
        var s = subjects[i];
        if (!s) {
          //log('all subjects saved.');
          cb && cb(null, data);
          return next();
        }

        s['type'] = ns;

        //log('updating subject %s', s.id);
        // we just don't care whether it will succeed.
        col_s.update({ 'id': s.id }, s, { upsert: true, w: -1 });
        //, function(err, r) {
          //if (err) {
            //if (cb) return cb(err);
            //return next();
          //}
        //});
        // let's save next subject
        save_subject(i + 1);
      }
      save_subject(0);
    });
  });
}
FetchStream.prototype.end = function(arg) {
  this.emit('end', arg);
  this.emit('close', arg);
};

var collect, _collect;

collect = task.api_pool.pooled(_collect = function(client, arg, next) {
  var collector = new FetchStream(arg, client);

  var user = arg.user;

  collector.on('error', function(err) {
    error('collecting for %s failed: %s', user.uid, err);
    collector.status = 'failed';
    collector.end();
  });

  collector.on('close', function(data) {
    // reset fot next time
    var obj = {};
    obj[arg.ns + '_n'] = collector.total;
    obj[arg.ns +'last_synced'] = new Date();
    obj[arg.ns +'last_sync_status'] = collector.status;

    log('updating user\'s last synced status... %s: %s, status: %s',
        arg.ns, collector.total, collector.status);

    // option
    obj['$upsert'] = true;
    user.update(obj);
  });

  collector.run();
});

function collect_in_namespace(ns) {
  return function(user) {
    if (user instanceof User) {
      collect({
        ns: ns,
        user: user
      });
    }
    User.get(user, function(err, user) {
      if (err || !user) {
        error('collect interest failed because getting user failed');
        return;
      }
      collect({
        ns: ns,
        user: user
      });
    });
  };
}

var exports = {};

central.DOUBAN_APPS.forEach(function(item) {
  exports['collect_' + item] = collect_in_namespace(item);
});

// collect all the interest
exports.collect_all = function(uid) {
  central.DOUBAN_APPS.forEach(function(item) {
    exports['collect_' + item](uid);
  });
};
module.exports = exports;
