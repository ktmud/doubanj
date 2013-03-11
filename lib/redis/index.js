var Redis = require('redis');
var Cached = require('./cached');

module.exports = function(opts) {
  var prefix = opts.prefix;
  var client = Redis.createClient(opts.servers, opts.options);
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
