var lodash = require('lodash');

// douban changed its CDN domain, this is for avoiding
// updating our database records
function douimg(url) {
  return url.replace(/(img[0-9])\.douban\.com/, '$1.doubanio.com');
}

module.exports = lodash.extend({
  noop: function(){},
  douimg: douimg,
  lodash: lodash,
  forEach: lodash.forEach,
  defaults: lodash.defaults,
  extend: lodash.extend,
  shuffle: lodash.shuffle,
  union: lodash.union,
  difference: lodash.difference,
}, require('./strftime'), require('./text'))
