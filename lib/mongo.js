// a mongodb model, like mongoose
var debug = require('debug');
var log = debug('dbj:mongo:info');
var error = debug('dbj:mongo:error');

var gpool = require('generic-pool');
var mongo = require('mongodb');

var cwd = process.cwd();
var conf = require(cwd + '/conf');

var need_prepare = true;

var mongo_pool = gpool.Pool({
  name: 'mongo',
  create: function(callback) {
    var server, db;

    function parse_server(uri) {
      var tmp = uri.split(':');
      return new mongo.Server(tmp[0], tmp[1] || mongo.Connection.DEFAULT_PORT);
    }

    if (conf.mongo.servers.length === 1) {
      server = parse_server(conf.mongo.servers[0]);
    } else {
      var ss = [];
      conf.mongo.servers.forEach(function(item) {
        ss.push(parse_server(item));
      });
      server = new mongo.ReplSetServers(ss);
    }
    db = new mongo.Db(conf.mongo.dbname, server);
    
    db.open(function(err, db) {
      if (err !== null) {
        error('db open failed due to %s', err);
        return callback(err);
      }

      log('mongodb pool connected database');

      if (need_prepare) {
        // prepare database, ensure indexes
        require(cwd + '/database')(db, function(err, db) {
          need_prepare = false;
          if (err) error('database preparation failed...', err); 
          callback(err, db);
        });
      } else {
        callback(null, db);
      }
    });
  },
  destroy: function(db) { db.close(); },
  max: 5,
  //min: 1, // always keep at least one idle connection
  priorityRange: 5,
  log: log
});
var add_task = require('./task').queue(mongo_pool, 0);

function Model(info) {
  return this;
}

Model.prototype.kind = null;
Model.prototype._collection = null;

Model.prototype.get = function(uid, cb) {
  return cb(null, null);
};
Model.prototype.save = function(data, cb) {
  var self = this;
  add_task(function(db, next) {
    var collection = db.collection(self._collection); 
    if (self._id) {
      collection.save({
        _id: self._id
      }, self.toObject(), {
        upsert: true,
        w: 1
      }, function(err, res) {
        if (err) error('save %s %s faild due to %s', self.kind, self._id, err);
        cb(err, res);
        next(); // to continue other pool jobs
      });
    } else {
      log('inserting new %s %s', self.kind, self._id);
      collection.insert(self.toObject(), { w: 1 }, function() {
        if (err) error('insert %s %s faild due to %s', self.kind, self._id, err);
        cb(err, res);
        next(); // write job is serious, so we wait for it to complete
      });
    }
  });
};
Model.prototype.update = function(data, cb) {
  var self = this;
  add_task(function(db, next) {
    var collection = db.collection(self._collection); 
    if (self._id) {
      collection.save({
        _id: self._id
      }, self.toObject(), {
        upsert: true,
        w: 1
      }, function(err, res) {
        if (err) error('save %s %s faild due to %s', self.kind, self._id, err);
        cb(err, res);
        next(); // to continue other pool jobs
      });
    } else {
      log('inserting new %s %s', self.kind, self._id);
      collection.insert(self.toObject(), { w: 1 }, function() {
        if (err) error('insert %s %s faild due to %s', self.kind, self._id, err);
        cb(err, res);
        next(); // write job is serious, so we wait for it to complete
      });
    }
  });
};

Model.prototype.toObject = function() {
  return { '_id': this['_id'], 'id': this['id'], 'kind': this.kind };
};
Model.prototype.toString = function() {
  return JSON.stringify(this.toObject());
};

Model.prototype.getSelector = function() {
  var self = this;
  var selector = [];
  
  if (self.uid) {
    selector.push({ uid: self.uid });
  }
  if (self.id) {
    selector.push({ id: self.id });
  }

  if (selector.length === 2) {
    return {
      '$or': selector
    };
  }
  return selector[0];
};

add_task.pool = mongo_pool;
add_task.Model = Model;
module.exports = add_task;
