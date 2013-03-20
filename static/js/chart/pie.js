// @import ./consts.js

function Pie(container, options) {
  if (!container) throw new Error('Must give a container for Pie chart.');
  if (!(this instanceof Pie)) return new Pie(container, options);
  options = options || {};
  lodash.defaults(options, Pie.defaultOptions);
  this.options = options;
  var container = this.container = d3.select(container);
  this.data = options.data || container.attr('data-pie');
}

Pie.defaultOptions = {
  colors: DEFAULT_COLORS,
  width: 150,
  height: 150,
  data: null,
  sort: null,
  val: function(d) {
    return d.value;
  },
  textValue: function(d, i) {
    return  d.data.value + '\n' + d.data.label;
  },
  // offset from center point
  offsetUnit: 'em',
  textOffset: 'auto',
  // total offset
  textX: 0,
  textY: 0,
  textSize: "0.85em"
};

Pie.prototype.draw = function() {
  var self = this;
  var options = self.options;
  var container = self.container;
  var width = options.width, height = options.height;
  var radius = options.radius || Math.min(width, height) / 2 - 10;
  var radiusInner = options.radiusInner || 0;

  var arc = self.arc = d3.svg.arc().outerRadius(radius).innerRadius(radiusInner);
  var pie = self.pie = d3.layout.pie().sort(options.sort).value(options.val);
  var color = self.color = d3_colors(options.colors);

  var svg = self.svg = self.container.append('svg')
  .attr('height', height).attr('width', width)
  .append('g')
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


  var data = d3.csv.parse(self.data);
  var g = svg.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

  g.append("path").attr("d", arc)
      .style("fill", function(d) { return color(d.data.value); });

  // default text x y
  var textY = options.textY, textX = options.textX;
  var textZ = options.textOffset;
  var autoZ = textZ === 'auto';
  var unit = autoZ ? '' : options.offsetUnit;

  var textValue = options.textValue;

  g.each(function(d, i) {
    var t = textValue(d);
    var r = autoZ ? radius / 6 : textZ;
    var c = (d.startAngle + d.endAngle) / 2;
    //* 90 / Math.PI;
    var x = Math.sin(c) * r;
    var y = - Math.cos(c) * r;
    x += textX;
    y += textY;

    var lines = t.split('\n');
    // 0.17... = 10 * 3.14 / 180
    if (d.endAngle - d.startAngle < 0.17 * lines.length && c > 3.2) {
      y += lines.length * 7;
    }

    var text = svg.append("text")
      .attr("transform", "translate(" + arc.centroid(d) + ")")
      .attr("font-size", options.textSize)
      .style("text-anchor", "middle")

    if (options.textColor) {
      text.style("fill", options.textColor(d));
    }

    lodash.each(lines, function(t, i) {
      text.append('tspan')
      .attr('x', 0)
      .attr('dx', x + unit)
      .attr('dy', i ? (i + 0.15 + 'em') : y + unit)
      .text(t);
    });
  });
};
