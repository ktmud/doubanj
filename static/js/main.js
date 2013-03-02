require.register("jquery", function(exports, require, module){
// @import ../components/component-jquery/index.js
});
require.register("main", function(exports, require, module) {
  // expose to window
  window.jQuery = window.$ = require('/jquery');
  window.Sizzle = $.find;
  // @import ../components/bootstrap/docs/assets/js/bootstrap.js
});
require('main');
