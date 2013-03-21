function Treemap(container, options) {
  if (!container) throw new Error('Must give a container for Treemap.');
  if (!(this instanceof Treemap)) return new Treemap(container, options);
  options = lodash.defaults(options, Treemap.defaultOptions);

  var self = this;
  self.options = options;
  self.container = d3.select(container);
  self.data = options.data;

  d3.rebind(self, self.container, 'on');
}

Treemap.defaultOptions = {
  colors: DEFAULT_COLORS,
  width: 600,
  height: 400,
  name_prop: '_id',
  href: null,
  value: function(d) { return 1; },
  text: null,
  position: function() {
    this.style("left", function(d) { return d.x + "px"; })
        .style("top", function(d) { return d.y + "px"; })
        .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
        .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
  }
};

Treemap.prototype.draw = function(data) {
  var self = this;

  data = data || this.data;

  var options = self.options
    , colors = options.colors
    , name_prop = options.name_prop
    , container = self.container
    , width = options.width
    , height = options.height;

  var color = colors ? d3_colors(colors) : d3.scale.category20c();
  var text = options.text || function(d) { return d.children ? null : d[name_prop]; };

  var treemap = self.treemap = d3.layout.treemap()
    .size([width, height])
    .sticky(true)
    .value(options.value);

  var nodes = self.nodes = container.datum(data).selectAll('.node')
    .data(treemap.nodes)
  .enter().append('div')
  .attr('class', function(d) { return d.children ? 'node parent' : 'node'; })
    .call(options.position)
    .style('background', function(d) {
      if (d.children) return color(d[name_prop]);
      var kid_len = d.parent.children.length;
      var factor = Math.pow(d.value / d.parent.value * kid_len, 0.29);
      return d3.hsl(color(d.parent[name_prop])).brighter(1.57).darker(factor);
    })
    .append('a')
    .text(text);

  if (options.href) {
    nodes.attr('href', options.href);
  }

  return self;
};
