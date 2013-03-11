function extend(target) {
  // Using `extend` from https://github.com/Raynos/xtend 
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i]
      , keys   = Object.keys(source);

    for (var j = 0; j < keys.length; j++) {
      var name = keys[j];
      target[name] = source[name];
    }
  }
  return target
}
function defaults(target, defaults) {
  for (var k in defaults) {
    if (!(k in target)) {
      target[k] = defaults[k];
    }
  }
}
module.exports = extend({
  noop: function(){},
  defaults: defaults,
  extend: extend,
}, require('./strftime'), require('./text'))
