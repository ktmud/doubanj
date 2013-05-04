//@@nowrap
Do('lodash', 'd3', 'chart/all', function(_require) {
  var d3 = require('d3');
  var chart = require('chart/all');
  var lodash = require('lodash')._;

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

  var tag_props = { tags: 1, personal_tags: 1, public_tags: 1 };
  function search_url(ns, txt) {
    return 'http://' + ns + '.douban.com/subject_search?search_text=' + encodeURIComponent(txt);
  }
  function tag_url(ns, txt) {
    return '/tag/' + encodeURIComponent(txt);
  }

  // Abbreviations for publisher / autho
  // @import ./abbrs.js

  var treemaps = $('div.chart-treemap');

  treemaps.each(function(i, item) {
    var d_treemap = $(item);
    var ns = d_treemap.data('ns');
    var c_treemap = new chart.Treemap(d_treemap[0], {
      width: d_treemap.width(),
      text: function(d) {
        var t = d._id;
        if (d.children || !t) return null;
        for (var k in abbrs) {
          t = t.replace(new RegExp(k), abbrs[k]);
        }
        return t;
      },
      height: d_treemap.height(),
      value: function(d) {
        return d.count * (d.factor || 1);
      },
      href: function(d) {
        if (d.children) return null;
        if (d.parent && d.parent._id in tag_props) return tag_url(ns, d._id); 
        return search_url(ns, d._id); 
      }
    });
    c_treemap.draw(d_treemap.data('tree'));
    c_treemap.nodes.attr('target', 'db-book')
    .attr('title', function(d) { return d.children ? '' : d._id + '(' + d.count + '本)'; });
  });
});
