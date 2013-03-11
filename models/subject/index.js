var Base = require('./base');

module.exports = Base;

['book'].forEach(function(item) {
  var cls = require('./' + item);
  //central.redis.cached.register(cls);

  module.exports[item] = cls;
});
