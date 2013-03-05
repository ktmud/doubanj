//@@nowrap
Do('lodash', 'd3', 'chart/all', function(_require) {
  var d3 = _require('d3');
  var chart = require('chart/all');

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
  var charts = [];
  $('div.chart-bar').each(function(i, item) {
    var node = $(item); 
    charts.push([node,
      chart.Bar(item, {
        legend: node.data('legend'),
        width: node.width(),
        height: node.height()
      })
    ]);
  });

  var _t;
  var win = $(window);
  win.scroll(function(e) {
    _t && clearTimeout(_t);
    _t = setTimeout(function() {
      lazycheck();
    }, 200);
  });

  function lazycheck() {
    while (charts[0] && charts[0][0].offset().top < win.scrollTop() + win.height() + 100) {
      charts.shift()[1].draw();
    }
  }
  lazycheck();
});
