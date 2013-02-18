module.exports = {};

['interest'].forEach(function(item) {
  module.exports[item] = require('./' + item);
});
