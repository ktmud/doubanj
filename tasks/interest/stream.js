var debug = require('debug');
var verbose = debug('dbj:tasks:interest:verbose');
var log = debug('dbj:tasks:interest:log');

var task = central.task;
var mongo = central.mongo;

var utils = require('../utils');

// request stream
function FetchStream(arg) {
  var ns = this.ns = arg.ns;
  var user = this.user = arg.user;

  var is_fresh = 'fresh' in arg ? arg.fresh : false;
  
  if (typeof user[ns + '_n'] !== 'number') {
    is_fresh = true;
  }
  if (arg._from_halt) is_fresh = false;

  this._is_fresh = is_fresh;
  this.uid = user.uid || user.id;
  this.total = null;
  this.perpage = arg.perpage || task.API_REQ_PERPAGE;
  this._last_fetched = user[ns + '_synced_n'] || 0;
  this._last_total = user[ns + '_n'] || 0;
  this.fetched = 0;

  // interests from when
  this._from = null;

  this.status = 'ready';

  this.api_uri = '/v2/' + arg.ns + '/user/' + this.uid + '/collections';

  this.col_query = { user_id: this.user.id };
  this.col_name = ns + '_interest';

  return this;
}

var util = require('util');

util.inherits(FetchStream, require('events').EventEmitter);
//util.inherits(FetchStream, require('stream').Stream);

// starting to collect...
FetchStream.prototype.run = function() {
  var self = this;

  log('starting fetch stream for %s', self.user.uid);
  self.status = 'ing';

  mongo(function(db) {
    var selector = self.col_query;

    if (self._is_fresh) {
      // remove user's all interests
      verbose('Cleaning old interests...');

      self._last_fetched = 0;
      self._last_total = null;

      db.collection(self.col_name).remove(selector, function(err, r) {
        self.fetch(self.fetched, self._fetch_cb());
      });
    } else if (self._last_total > self._last_fetched) {
      // means we are recovering from halt
      // reset numbers to last state.
      self.fetched = self._last_fetched;
      self.total = self._last_total;

      self.fetch(self.fetched, self._fetch_cb());
    } else {
      // find the latest updated one
      db.collection(self.col_name).findOne(selector, {
        sort: {
          updated: -1
        }
      }, function(err, item) {
        if (item) {
          self._from = (new Date(+item.updated + 1000)).toJSON();
          verbose('Collect new interests from %s..', self._from);
        }
        self.fetch(self.fetched, self._fetch_cb());
      })
    }
  });
  return self;
};

// fetch page by page
FetchStream.prototype._fetch_cb = function() {
  var self = this;
  return function(err, data) {
    if (err) return self.emit('error', err);

    var total = data.total;

    // no data
    if (total === 0) {
      log('NO DATA at all');
      self.total = 0;
      self.status = 'succeed';
      return self.end();
    } else if (!total) {
      // invalid total
      self.status = 'failed';
      return self.end();
    }

    if (self._from) {
      self._from_total = total;
    } else if (self.total && total != self.total) {
      // total changed during fetching, run again
      log('total number changed during fetching');
      self.fetched = 0;
      self.total = self._last_total = total;
      return self.run();
    } else {
      self._last_total = total;
    }

    self.total = total;
    self.fetched += data.collections.length;
    self._last_fetched += data.collections.length;

    // the total fetched number
    if (self.fetched >= total) {
      self.fetched = total;
      log('fetching reached end.');
      self.status = 'succeed';
      self.end();
    } else {
      // fetch next page
      self.fetch(self.fetched, self._fetch_cb());
    }
  };
};

var ERRORS = {
  '404': 'NO_USER',
};

// fetch one page of data
FetchStream.prototype.fetch = function(start, cb) {
  var self = this;

  //console.log(n);
  task.api(function(oauth2, next) {
    verbose('fetching %s~%s...', start, start + self.perpage);

    var client = oauth2.clientFromToken(self.token);

    var from = '';

    var query = { count: self.perpage, start: start };

    if (self._from) {
      query.from = self._from;
    }
    client.request('GET', self.api_uri, query, function(err, ret, res) {
      var n = central._interest_queue.queue.length;
      // release pool client
      setTimeout(next, oauth2.req_delay * n);

      var code = err && err.statusCode || res.statusCode;
      if (code !== 200) {
        var err_code = ERRORS[String(code)];
        self.user.invalid = err_code || 1;
        return self.emit('error', err_code || new Error('douban api responded with ' + code)); 
      }
      if (err) {
        return self.emit('error', err);
      }

      self.emit('fetched', ret);
      self.write(ret, cb);
    });
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

  if (!items.length) {
    cb && cb(null, data);
    self.emit('saved', data);
    return;
  }

  var ids = [], sids = [];
  // pick up subjects
  items.forEach(function(item, i) {
    item = utils.norm_interest(item);

    item['uid'] = uid;
    item['subject_id'] = item[ns + '_id'];

    ids.push(item.id);

    var s = item[ns];
    s = utils.norm_subject(s, ns);
    subjects.push(s);

    sids.push(s.id);

    delete item[ns];
  });

  // `next` is to release db client lock
  mongo(function(db) {
    var save_options = { w: 1, continueOnError: 1 };

    // save user interest
    verbose('Clear exsisting interests...');
    db.collection(ns + '_interest').remove({ id: { $in: ids } }, function(err, r) {
      if (err) console.error(err, uid);

      verbose('Saving interests...');

      db.collection(ns + '_interest').insert(items, save_options, function(err, r) {
        if (err) console.error(err, uid);

        // save subjects
        verbose('Saving subjects...');
        var col_s = db.collection(ns);
        col_s.remove({ id: { $in: sids } }, function(err, r) {
          col_s.insert(subjects, { continueOnError: true }, function(err, res) {
            verbose('saving complete.');
            cb && cb(null, data);
            self.emit('saved', data);
          });
        });

        //function save_subject(i) {
          //var s = subjects[i];

          //if (!s) {
            //verbose('all subjects in saving queue.');
            //cb && cb(null, data);
            //self.emit('saved', data);
            //return;
          //}

          ////log('updating subject %s', s.id);
          //// we just don't care whether it will succeed.
          //process.nextTick(function() {
            //s && col_s.update({ 'id': s.id }, s, { upsert: true, w: -1 });
          //});
          ////, function(err, r) {
            ////if (err) {
              ////if (cb) return cb(err);
              ////return next();
            ////}
          ////});
          //// let's save next subject
          //save_subject(i + 1);
        //}
        //save_subject(0);
      });
    });
  });

  self.emit('data', data);
}
FetchStream.prototype.isDrain = function() {
  return this.fetched >= this.total;
}
FetchStream.prototype.close = FetchStream.prototype.end = function(arg) {
  this.emit('end', arg);
  this.emit('close', arg);
};
FetchStream.prototype.updateUser = function(cb) {
  var self = this;
  var ns = self.ns;
  var obj = { invalid: 0 };

  obj[ns + '_n'] = self._last_total + (self._from_total || 0);
  obj[ns + '_synced_n'] = self._last_fetched;
  obj['last_synced'] = obj[ns +'_last_synced'] = new Date();
  obj['last_synced_status'] = obj[ns +'_last_synced_status'] = self.status;

  log('%s %s: %s/%s, status: %s',
      self.uid, ns, self._last_fetched, self._last_total, self.status);

  // database option
  obj['$upsert'] = true;

  if (self.isDrain() && self._from) {
    mongo(function(db) {
      db.collection(self.col_name).count(self.col_query, function(err, r) {
        if (!err) obj[ns + '_n'] = obj[ns + '_synced_n'] = r;
        self.user.update(obj, cb);
      });
    });
  } else {
    self.user.update(obj, cb);
  } 
};

module.exports = FetchStream;
