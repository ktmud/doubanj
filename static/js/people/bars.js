var charts = [];
$('div.chart-bar').each(function(i, item) {
  var node = $(item); 

  var w = node.width();
  var h = node.height();
  var bar = chart.Bar(item, {
    margin: [40, 20, 40, 40],
    legendTransform: function(d, i) {
      return "translate(" + -(i * 50 + 30) + "," + (h - 50) + ")";
    },
    width: w,
    height: h
  });

  item._bar = bar;

  charts.push([node, bar]);
});

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

$('div.chart').delegate('.chart-filter li', 'click', function(e) {
  e.preventDefault();
  var node = $(this);
  var bar = node.parent().nextAll('.chart-bar')[0]._bar;
  var arg = node.find('a').attr('href').split(':');

  node.addClass('active').siblings().removeClass('active');

  // call filter function
  bar[arg[0] + '_filter'](arg[1]);
});
