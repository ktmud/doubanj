module.exports = {
  strftime: require('./strftime'),
  extend: function extend(target) {
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
}
