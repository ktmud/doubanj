// @import ./consts.js

function Bar(container, options) {
  if (!container) throw new Error('Must give a container for Pie chart.');
  if (!(this instanceof Bar)) return new Bar(container, options);
  options = lodash.defaults(options, Bar.defaultOptions);

  var self = this;

  self.options = options;
  self.container = d3.select(container);
  self.data = options.data || self.container.attr('data-bar');

  self._all_data = d3.csv.parse(self.data);

  d3.rebind(self, self.container, 'on');

  self.style = options.multiple;
}

Bar.defaultOptions = {
  colorCate: '10',
  //colors: D3_COLORS,
  periodic: null,
  width: 300,
  height: 160,
  data: null,
  sort: null,
  legend: '10x10', // the size of legend bar
  legendTransform: function(d, i) { return "translate(0," + i * 20 + ")"; },
  showText: true,
  multiple: 'stacked',
  xAxis: {
    orient: 'bottom',
    tickSize: 0,
    tickPadding: 6
  },
  yAxis: {
    orient: 'left',
    tickSize: 3,
    tickPadding: 5
  },
  yRotate: 0,
  yunit: '',
  val: function(d) {
    return d.value;
  },
  margin: [20, 20, 40, 40],
  textSize: "0.85em"
};

Bar.prototype.draw = function(data) {
  var self = this, options = self.options;

  self._prepare(data || self._all_data);

  self.drawAxis();

  if (options.legend && self._is_multi) {
    self.drawLegend();
  }

  self.drawData();
};

Bar.prototype._n = function() {
  return lodash.keys(this._data[0]).length - 1;
};
Bar.prototype._m = function() {
  return this._data.length;
};

Bar.prototype._prepare = function(data) {
  var self = this;

  if (self._prepared && !data) return;

  self._prepared = true;

  var options = self.options,
      container = self.container,
      margin = self.margin = options.margin,
      width = self.width = options.width - margin[1] - margin[3],
      height = self.height = options.height - margin[0] - margin[2];

  if (typeof data === 'string') {
    data = self._data = d3.csv.parse(self.data);
  } else {
    self._data = data;
  }

  var multi_keys = self.multi_keys = d3.keys(data[0]);
  var yname = self.yname = multi_keys.shift();

  if (self._filter) {
    data = self._data = data.filter(self._filter);
  }

  if (multi_keys.length > 1) this._is_multi = true;

  var color = self.color = d3_colors(options.colorCate, options.colors);

  var n = self.n = self._n(), // number of layers
      m = self.m = self._m(); // number of samples per layer

  var stack = self.stack = d3.layout.stack();
  var layers = bumpLayers(data, multi_keys, yname);
  layers = self.layers = stack(layers);

  self.color.domain(multi_keys);

  var yGroupMax = self.yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); });
  var yStackMax = self.yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });


  var periodic = options.periodic === null ? container.attr('data-periodic') : options.periodic;

  var xdomain = data.map(function(d) { return d[yname]; });

  var x = self.x = d3.scale.ordinal()
      .domain(xdomain)
      .rangeRoundBands([0, width], .08);

  if (periodic) {
    var xtime = self.xtime = d3.time.scale().range([0, width])
     .domain(datedomain(xdomain));
  }

  self.y = d3.scale.linear()
      .domain([0, self.style === 'grouped' ? yGroupMax : yStackMax])
      .range([height, 0]);

  self.svg = self.container.select('svg > g');
      
  if (self.svg.empty()) {
    self.svg = self.container.append("svg")
      .attr("width", options.width)
      .attr("height", options.height)
      .append("g")
      .attr("transform", "translate(" + margin[3] + "," + margin[0] + ")");
  } else {
    self.svg.selectAll('.layer').remove();
  }
};

Bar.prototype.drawData = function() {
  var self = this
  , options = self.options
  , container = self.container
  , color = self.color
  , multi_keys = self.multi_keys
  , x = self.x
  , width = self.width
  , height = self.height;

  self.layer = self.svg.selectAll(".layer")
    .data(self.layers)
  .enter().append("g")
    .attr("class", "layer")
    .style("fill", function(d, i) { return color(multi_keys[i]); });

  self.rect = self.layer.selectAll("rect")
    .data(function(d) { return d; })
  .enter().append("rect")
    .attr("x", function(d) { return x(d.x); })
    .attr("y", height)
    .attr("width", x.rangeBand())
    .attr("height", 0);

  self[self.style]();
};

var one_day = 60000 * 60 * 24;
var reg_period = /([\+\-])?([\d]+)(\w)/;
Bar.prototype.time_filter = function(a, b) {
  var self = this;
  if (a === 'all') {
    self._filter = null;
  } else if ( a === 'last_year') {
    b = d3.time.year(new Date());
    a = new Date(b);
    a.setFullYear(a.getFullYear() - 1);
  } else if (typeof a === 'string') {
    b = new Date();

    var m = a.match(reg_period);
    var punc = m[1], unit = m[3];
    var n = parseInt(m[2], 10);
    
    a = new Date();

    if (punc === '-') {
      n = -n;
    }

    // Month
    if (unit === 'd') {
      a = +a + one_day * n;
    } if (unit === 'm') {
      a = +a + n * one_day * 31 
    } else if (unit === 'y') {
      a = a.setFullYear(a.getFullYear() + n);
    }
  }

  if (a && b) {
    self._filter = function(d) {
      var yname = self.yname;
      d = new Date(d[yname]);
      return d >= a && d <= b;
    };
  }

  // redraw
  self.draw();
};

Bar.prototype.hideText = function() {
  this.text && this.text.text('');
};
Bar.prototype.drawText = function(delay) {
  delay = delay || 500;

  var self = this;
  var x = self.x;
  var y = self.y;

  var text = self.text = self.text = self.layer.selectAll('text').data(function(d) { return d; }).enter().append("text")
  .attr('x', function(d) { return x(d.x); })
  .attr('y', 0);

  var rb = x.rangeBand() / 2;
  text.transition()
    .duration(delay)
    .delay(function(d, i) { return i * 10; })
    .attr('x', function(d) { return x(d.x) + rb; })
    .attr('dx', function(d) { return -(String(d.x).length / 4) + 'em'; })
    .attr('dy', function(d) { return y(d.y + d.y0) - 5; })
    .text(function(d) { return d.y || ''; });
};

Bar.prototype.grouped = function transitionGrouped(dur) {
  var self = this;
  var y = self.y, x = self.x, n = self.n;

  y.domain([0, self.yGroupMax]);

  self.style = 'grouped';

  dur = dur || 400;

  var rect = self.rect.transition();

  rect.duration(dur).delay(function(d, i) { return i * 10; })

  rect.attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
      .attr("width", x.rangeBand() / n)
    .transition()
      .attr("y", function(d) { return y(d.y); })
      .attr("height", function(d) { return self.height - y(d.y); });
  return self;
}

Bar.prototype.stacked = function transitionStacked(dur) {
  var self = this;
  var y = self.y, x = self.x;

  y.domain([0, self.yStackMax]);

  self.style = 'stacked';

  self.hideText();

  dur = dur || 400;

  if (self.options.showText && self.layers.length === 1) {
    self.drawText(dur);
  }

  var rect = self.rect.transition();

  rect.duration(dur).delay(function(d, i) { return i * 10; })

  rect.attr("y", function(d) { return y(d.y0 + d.y); })
      .attr("height", function(d, i) { return y(d.y0) - y(d.y0 + d.y);
      })
    .transition()
      .attr("x", function(d) { return x(d.x); })
      .attr("width", x.rangeBand());
  return self;
}

Bar.prototype.drawAxis = function() {
  var self = this
  , options = self.options
  , container = self.container
  , svg = self.svg
  , width = self.width
  , height = self.height
  , x = self.x
  , xtime = self.xtime
  , y = self.y;

  var opt_xAxis = options.xAxis;
  var opt_yAxis = options.yAxis;

  var xAxis = self.xAxis = d3.svg.axis();
  var yAxis = self.yAxis = d3.svg.axis();

  lodash.each(['orient', 'tickSize', 'tickPadding'], function(prop) {
    if (opt_xAxis && prop in opt_xAxis) {
      xAxis[prop](opt_xAxis[prop]);
    }
    if (opt_yAxis && prop in opt_yAxis) {
      yAxis[prop](opt_yAxis[prop]);
    }
  });

  if (opt_xAxis) {
    if (!self._g_x) {
      self._g_x = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");
    }

    self.updateX();
  }

  if (opt_yAxis) {
    if (!self._g_y) {
      var y = self._g_y = svg.append("g").attr("class", "y axis");
      var yunit = container.attr('data-y') || options.yunit;
      if (yunit) {
        var yt = y.append("text")
          .attr('dx', "0.2em")
          .attr("dy", ".71em");

        if (options.yRotate) {
          var text_x = 0, r = -90;
          if (opt_yAxis.orient === 'right') {
            text_x = 8;
            r = 90;
          }
          yt.style("text-anchor", "end")
            .attr("y", 6)
            .attr('x', text_x)
            .attr("transform", 'rotate(' + r + ')');
        } else {
          yt.attr('x', 2)
            .style("text-anchor", "center");
        }
        yt.text(yunit);
      }
    }
    self.updateY();
  }
};

Bar.prototype.updateX = function() {
  var self = this;
  var x = self.x;
  var xtime = self.xtime;
  var xAxis = self.xAxis;
  if (xtime) {
    xAxis.scale(xtime).tickFormat(customTimeFormat);
  } else {
    xAxis.scale(x);
  }
  self._g_x.call(xAxis);
};

Bar.prototype.updateY = function() {
  var self = this;
  //var yAxis = self.yAxis = d3.svg.axis().scale(self.y)
  self._g_y.call(self.yAxis.scale(self.y));
};

Bar.prototype.drawLegend = function() {
  var self = this
    , options = self.options
    , width = self.width
    , color = self.color
    , svg = self.svg;

  var wh = options.legend.split('x');
  var legend = self.legend = svg.selectAll(".legend")
      .data(color.domain().slice())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", options.legendTransform);

  legend.append("rect")
    .attr("x", width - wh[0])
    .attr("width", wh[0])
    .attr("height", wh[1])
    .style("fill", color);

  legend.append("text")
    .attr("x", width + 2)
    .attr("y", wh[1] / 2)
    .attr("dx", function(d) { return d.length + "em" })
    .attr("dy", "0.4em")
    .style("text-anchor", "end")
    .text(function(d) { return d; });
};

// ref: http://bl.ocks.org/mbostock/3943967
function bumpLayers(data, multi_keys, yname) {
  var ret = [];
  var i, l = multi_keys.length;
  for (i = 0; i < l; i++) ret.push(bump(multi_keys[i]));

  function bump(k) {
    var ret = [];
    var i = 0, l = data.length;
    for (; i < l; i++) ret.push({ x: i, y: parseInt(data[i][k]) });
    return ret;
  }

  return ret;
}

function datedomain(data) {
  var ret = data.map(function(d) {
    return new Date(d);
  });
  return d3.extent(ret, function(d) { return d; })
}
