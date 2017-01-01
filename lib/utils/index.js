var lodash = require('lodash');

var utils = {
  noop: function(){},
  douimg: function douimg(url) {
    // douban changed its CDN domain, this is for avoiding
    // updating our database records
    return url.replace(/(img[0-9])\.douban\.com/, '$1.doubanio.com');
  },
  lodash: lodash,
  forEach: lodash.forEach,
  defaults: lodash.defaults,
  extend: lodash.extend,
  shuffle: lodash.shuffle,
  union: lodash.union,
  difference: lodash.difference,
};

module.exports = utils;

lodash.extend(utils, require('./strftime'), require('./text'))
