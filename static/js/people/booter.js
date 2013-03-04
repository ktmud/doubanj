//@@nowrap
Do('lodash', 'd3', 'chart/all', function(_require) {
  var d3 = _require('d3');
  var chart = require('chart/all');

  var d_summary = $('#d-summary');
  if (d_summary.length) {
    chart.Pie(d_summary[0], {
      width: d_summary.width(),
      height: d_summary.height() - 20,
      textValue: function(d) {
        return d.data.value + '%' + '\n' + d.data.label;
      },
    }).draw();
  }
});
