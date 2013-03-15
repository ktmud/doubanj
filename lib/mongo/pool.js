// a mongodb model, like mongoose
var debug = require('debug');
var log = debug('dbj:mongo:info');
var verbose = debug('dbj:mongo:verbose');
var error = debug('dbj:mongo:error');

var gpool = require('generic-pool');
var mongo = require('mongodb');

var cwd = process.cwd();
var conf = require(cwd + '/conf');
var utils = require(cwd + '/lib/utils');

var noop = utils.noop;

var need_prepare = true;

var mongo_pool = gpool.Pool({
  name: 'mongo',
  create: connetct_db,
  destroy: function(db) { db.close(); },
  max: 3,
  min: 1, // always keep at least one idle connection
  priorityRange: 5,
  log: false,
  //log: verbose
});

var db, forever_db;
function add_task(fn) {
  var _db = forever_db;
  if (!_db || _db.closed) _db = db;
  if (_db && !_db.closed) return fn(_db, noop);
  connetct_db(function(err, client) {
    db = forever_db = add_task.db = client;
    fn(db, noop);
  });
}

process.on('exit', function() {
  db && db.close();
});

/**
* To connect the mongodb databse
*/
function connetct_db(callback, throw_err) {
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
  db = new mongo.Db(conf.mongo.dbname, server, { w: 1 });
  
  db.open(function(err, db) {
    if (err !== null) {
      error('db open failed: %s', err);
      if (throw_err) throw err;
      return callback(err, db);
    }

    verbose('mongodb pool connected database');

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
  db.on('close', function() {
    db.closed = true;
  });
}
// set up a database connection at start,
// throw err if connection failed
connetct_db(function(err, _db) {
  forever_db = _db;
}, true);

module.exports = mongo_pool;
module.exports.instant = add_task;
