// @import ./consts.js

function Bar(container, options) {
  if (!container) throw new Error('Must give a container for Pie chart.');
  if (!(this instanceof Bar)) return new Bar(container, options);
  options = lodash.defaults(options, Bar.defaultOptions);
  this.options = options;
  this.container = d3.select(container);
  this.data = options.data || container.attr('data-bar');
}

Bar.defaultOptions = {
  colors: D3_COLORS,
  width: 150,
  height: 150,
  data: null,
  sort: null,
  val: function(d) {
    return d.value;
  },
  textSize: "0.85em"
};

