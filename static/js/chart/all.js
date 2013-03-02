require.register("chart/all", function(exports, require, module){
  var lodash = require('/lodash')._;
  var d3 = require('/d3');

  // @import ./pie.js
  // @import ./bar.js

  module.exports = {
    Pie: Pie,
    Bar: Bar,
  };
});
