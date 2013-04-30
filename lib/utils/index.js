var lodash = require('lodash');

module.exports = lodash.extend({
  noop: function(){},
  lodash: lodash,
  defaults: lodash.defaults,
  extend: lodash.extend,
  shuffle: lodash.shuffle,
  union: lodash.union,
  difference: lodash.difference,
}, require('./strftime'), require('./text'))
