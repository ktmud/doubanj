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

    var w = node.width();
    var h = node.height();
    var bar = chart.Bar(item, {
      margin: [20, 20, 40, 40],
      legendTransform: function(d, i) {
        return "translate(" + -(i * 50 + 30) + "," + (h - 30) + ")";
      },
      width: w,
      height: h
    });

    item._bar = bar;

    charts.push([node, bar]);
  });

  var lodash = require('lodash');

  $('input[name=bar-style]').bind('change', function(e) {
    var elem = this;
    if (elem.checked) {
      var fn = elem.value;
      $(elem).closest('.row').find('div.chart-bar').each(function(i, item) {
        if (item._bar) {
          item._bar[fn]();
          setTimeout(function() {
            item._bar.updateY();
          }, 1000)
        }
      });
    }
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
