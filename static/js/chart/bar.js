
function Bar(container, options) {
  if (!container) throw new Error('Must give a container for Pie chart.');
  if (!(this instanceof Bar)) return new Bar(container, options);
  options = lodash.defaults(options, Pie.defaultOptions);
  this.options = options;
  this.container = d3.select(container);
}

