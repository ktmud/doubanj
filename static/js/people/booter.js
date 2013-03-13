//@@nowrap
Do('lodash', 'd3', 'chart/all', function(_require) {
  var d3 = require('d3');
  var chart = require('chart/all');
  var lodash = require('lodash');

  var d_summary = $('#d-summary');
  if (d_summary.length) {
    chart.Pie(d_summary[0], {
      width: d_summary.width(),
      height: d_summary.height() - 10,
      textValue: function(d) {
        return d.data.value + '%' + '\n' + d.data.label;
      },
    }).draw();
  }

  // @import ./bars.js
});
