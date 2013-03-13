// ========== for crossfilter detailed view =======
function get_detailed(bar, list) {
  var crossfilter = require('crossfilter').crossfilter;

  function dataList(div) {
    var data = bar.parsed_data;
  }

  list = d3.selectAll(list).data([dataList]);

  var brush = d3.svg.brush(),
      brushDirty,
      dimension,
      group,
      round;

  var g = bar.svg.append('g.brush-layer');

  // Initialize the brush component with pretty resize handles.
  var gBrush = g.append("g").attr("class", "brush").call(brush);

  gBrush.selectAll("rect").attr("height", height);
  gBrush.selectAll(".resize").append("path").attr("d", resizePath);

  // Only redraw the brush if set externally.
  if (brushDirty) {
    brushDirty = false;
    g.selectAll(".brush").call(brush);
    div.select(".title a").style("display", brush.empty() ? "none" : null);
    if (brush.empty()) {
      g.selectAll("#clip-" + id + " rect")
      .attr("x", 0)
      .attr("width", width);
    } else {
      var extent = brush.extent();
      g.selectAll("#clip-" + id + " rect")
      .attr("x", x(extent[0]))
      .attr("width", x(extent[1]) - x(extent[0]));
    }
  }

  function barPath(groups) {
    var path = [],
    i = -1,
    n = groups.length,
    d;
    while (++i < n) {
      d = groups[i];
      path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
    }
    return path.join("");
  }

  function resizePath(d) {
    var e = +(d == "e"),
    x = e ? 1 : -1,
    y = height / 3;
    return "M" + (.5 * x) + "," + y
    + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
    + "V" + (2 * y - 6)
    + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
    + "Z"
    + "M" + (2.5 * x) + "," + (y + 8)
    + "V" + (2 * y - 8)
    + "M" + (4.5 * x) + "," + (y + 8)
    + "V" + (2 * y - 8);
  }


  brush.on("brushstart.chart", function() {
    var div = d3.select(this.parentNode.parentNode.parentNode);
    div.select(".title a").style("display", null);
  });

}

function detail_expand() {
  var trigger = $(this);
  var elem = this;
  trigger.siblings('.details-content').show(300);

  if (elem.detailed) return elem.detailed.show();

  Do('crossfilter', function() {
    var list = trigger.siblings('.details-content')[0];
    var bar = $(elem.href.split(':')[1])[0]._bar;
    elem.detailed = get_detailed(bar, list);
  });
}

function detail_collapse(e) {
  $(this).siblings('.details-content').hide(400);
}

$('.details-toggler').toggle(detail_expand, detail_collapse);


