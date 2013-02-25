module.exports = {};

['interest', 'compute'].forEach(function(item) {
  module.exports[item] = require('./' + item);
});
