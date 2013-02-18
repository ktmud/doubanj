/*
* task pools
*/
var debug = require('debug');
var log = debug('dbj:pool:info');
var error = debug('dbj:pool:error');

var oauth = require('oauth');
var gpool = require('generic-pool');

var conf = require(process.cwd() + '/conf');

// http(s) request pool, mainly for douban api
var api_pool = gpool.Pool({
  name: 'api',
  create: function(callback) {
    var client = new oauth.OAuth2(conf.douban.key, conf.douban.secret);
    callback(null, client);
  },
  destroy: function() { },
  max: 5,
  //min: 5,
  priorityRange: 5,
  log: log
});

function queue(pool, default_priority) {
  return function(fn, priority) {
    pool.acquire(function(err, client) {
      // `fn` defination is like `fn(db, next)`;
      if (fn.length === 2) {
        log('async calling job');
        fn(client, function(err) {
          if (err) error('async job:\n%s\nfailed because:\n%s', job.toString(), err);
          pool.release(client);
        });
      } else {
        fn(client);
        pool.release(client);
      }
    }, typeof priority === 'undefined' ? default_priority : priority);
  }
}

module.exports = {
  api_pool: api_pool,
  api: queue(api_pool),
  queue: queue
};
