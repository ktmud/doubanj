/**
* Redis client wrapper
*/
var Redis = require('redis');
var Cached = require('redis-cached');

module.exports = function(opts) {
  var prefix = opts.prefix;
  var client;
  if (opts.url) {
    client = Redis.createClient(opts.url, { detect_buffers: true });
  } else {
    client = Redis.createClient(opts.port, opts.host, { detect_buffers: true });
  }
  var cached = Cached(client, {
    ttl: opts.ttl,
    prefix: prefix
  });

  return {
    Redis: Redis,
    rd: client,
    client: client,
    clear: function(key, cb) {
      client.del(prefix + key, cb);
    },
    cached: cached
  };
}
