// @import ../../bower_components/jquery/dist/jquery.js
require.register("jquery", function(exports, require, module){
  module.exports = window.jQuery
})
require.register("main", function(exports, require, module) {
  // @import ../../bower_components/bootstrap/dist/js/bootstrap.js

  // numbers
  var nums = $('span.num')
  if (nums.length) {
    Do('d3', function() {
      var d3 = require('/d3')
      var format = d3.format(',.2')
      nums.each(function() {
        var node = $(this)
        node.text(format(node.text()))
      })
    })
  }
})
require.register("utils/datetime", function(exports, require, module) {
  // @import ./utils/datetime.js
})

require('main')
