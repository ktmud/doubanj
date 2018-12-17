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

var mongo_pool = gpool.createPool({
  name: 'mongo',
  create: connect_db,
  destroy: function(db) { db.close(); },
  max: 4,
  //min: 1, // always keep at least one idle connection
  priorityRange: 6,
  log: false,
  //log: verbose
});

var db;
function add_task(fn) {
  if (db && !db.closed) return fn(db, noop);
  connect_db(function(err, client) {
    db = add_task.db = client;
    fn(db, noop);
  });
}

process.on('exit', function() {
  db && db.close();
});

/**
* To connect the mongodb databse
*/
function connect_db(callback, throw_err) {
  var server, db;

  function parse_server(uri) {
    var tmp = uri.split(':');
    return new mongo.Server(tmp[0], tmp[1] || mongo.Connection.DEFAULT_PORT);
  }

  if (conf.mongo.url) {
    mongo.MongoClient.connect(conf.mongo.url, callback);
  } else {
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
    db.open(function(err, mongoClient) {
      if (err !== null) {
        error('db open failed: %s', err);
        console.trace(err);
        if (throw_err) throw err;
        //return callback(err, db);
      }

      if (conf.mongo.username) {
        db.authenticate(conf.mongo.username, conf.mongo.password, function(err, result) {
          verbose('mongodb pool connected database');
          callback(err, mongoClient);
        });
      } else {
        verbose('mongodb pool connected database');
        callback(err, mongoClient);
      }
    });
    db.on('close', function() {
      db.closed = true;
    });
  }
}
// set up a database connection at start,
// throw err if connection failed
connect_db(function(err, _db) {
  db = _db;
  // prepare database, ensure indexes
  require(cwd + '/database')(_db, function(err) {
    if (err) error('Database preparation failed...', err);
    log('database is ready.');
  });
}, true);

module.exports = mongo_pool;
module.exports.instant = add_task;
