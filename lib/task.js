/*
* task pools
*/
var debug = require('debug');
var log = debug('dbj:pool:info');
var error = debug('dbj:pool:error');

var gpool = require('generic-pool');
const decorator = require('generic-pool-decorator')
var douban = require('./douban');

var conf = require(process.cwd() + '/conf');

var mores = conf.douban_more || [ conf.douban ];

var i_tick = 0;
var n_mores = mores.length;
var n_main = 2;

function oauth2_item(item) {
  var is_specified = true;
  if (!item) {
    item = mores[i_tick];
    i_tick++;
    if (i_tick >= n_mores) i_tick = 0;
    is_specified = false;
  }
  var ret = new douban.OAuth2(item.key, item.secret);
  // default to maximium 10 request per limit
  var req_delay = 60000 / (item.limit || 10);
  if (is_specified) {
    req_delay = req_delay * n_main;
  } else {
    req_delay = req_delay / n_mores;
  }
  log('OAuth2 client request delay: %ss', req_delay / 1000)
  ret.req_delay = req_delay;
  return ret;
}

// http(s) request pool, mainly for douban api
var api_pool = gpool.createPool({
  name: 'api',
  create: function(callback) {
    var oauth2 = oauth2_item(conf.douban);
    callback(null, oauth2);
  },
  destroy: function() { },
  // 主请求池允许开多个 client ，防止单个请求挂起时影响后续所有请求
  max: n_main,
  //min: 1,
  priorityRange: 6,
  //log: conf.debug ? log : false
});

var api_pool2 = gpool.createPool({
  name: 'api',
  create: function(callback) {
    var oauth2 = oauth2_item();
    callback(null, oauth2);
  },
  destroy: function() { },
  max: n_mores,
  //min: 1,
  priorityRange: 6,
  //log: conf.debug ? log : false
});

var computings = { n: 0 };
var compute_pool = gpool.createPool({
  name: 'compute',
  create: function(callback) {
    computings.n++;
    callback(null, computings);
  },
  destroy: function() { computings.n--; },
  max: 3,
  priorityRange: 6,
});
compute_pool.pooled = decorator(compute_pool);

function queue(pool, default_priority) {
  return function(fn, priority) {
    pool.acquire(function(err, client) {
      // `fn` defination is like `fn(db, next)`;
      if (fn.length === 2) {
        //log('async calling job');
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
  api_pool2: api_pool2,
  compute_pool: compute_pool,
  compute: queue(compute_pool),
  api: queue(api_pool, 3), // default priority is 3
  api2: queue(api_pool2, 3),
  API_REQ_DELAY: 60000 / (conf.douban.limit || 10),
  API_REQ_PERPAGE: 100,
  queue: queue
};
