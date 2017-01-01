var central = require('../central');
var utils = central.utils;
var assets = central.assets;

var helpers = {
  conf: central.conf,
  trunc: utils.trunc,
  simple_trunc: utils.simple_trunc,
  strftime: function(format, time) {
    // `this` is the `locals`
    var timezone = this.req.ipgeo.timezone;
    return utils.strftime(format, time, timezone);
  },
  time_elapse: utils.time_elapse,
  chinese_period: utils.chinese_period,
  urlmap: function() {
    try {
      return JSON.stringify(assets.urlMap.apply(this, arguments));
    } catch (e) {}
    return '';
  },
  hashmap: function() {
    try {
      return JSON.stringify(assets.hashMap.apply(this, arguments));
    } catch (e) {}
    return '';
  },
  filehash: assets.getHash,
  istatic: assets.istatic.serve(),
};

utils.extend(helpers, utils.timeformats);

module.exports = helpers;

