
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
  colors: ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"],
  width: 150,
  height: 150,
  data: null,
  sort: null,
  val: function(d) {
    return d.value;
  },
  text: function(d) {
    return d.data.label + ' ' + d.data.value;
  },
  textSize: "0.8em"
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
  var color = self.color = d3.scale.ordinal().range(options.colors);

  var svg = self.svg = self.container.append('svg')
  .attr('height', height).attr('width', width)
  .append('g')
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


  var data = d3.csv.parse(self.data);
  var g = svg.selectAll(".arc")
      .data(pie(data))
    .enter().append("g")
      .attr("class", "arc");

  g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color(d.data.value); });

  g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", options.textSize)
      .style("text-anchor", "middle")
      .text(options.text);
};
