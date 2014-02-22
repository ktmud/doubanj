// @import ../../bower_components/jquery/dist/jquery.js
require.register("jquery", function(exports, require, module){
  module.exports = window.jQuery
});
require.register("main", function(exports, require, module) {
  // @import ../../bower_components/bootstrap/dist/js/bootstrap.js
});
require.register("utils/datetime", function(exports, require, module) {
  // @import ./utils/datetime.js
});

require('main');
