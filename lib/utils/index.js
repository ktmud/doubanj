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

var nativeRandom = Math.random;
var floor = Math.floor;

// from lodash
function shuffle(collection) {
  var index = -1,
      length = collection ? collection.length : 0,
      result = Array(typeof length == 'number' ? length : 0);

  collection.forEach(function(value) {
    var rand = floor(nativeRandom() * (++index + 1));
    result[index] = result[rand];
    result[rand] = value;
  });
  return result;
}

function uniqConcat(a, b) {
  var o = {}, ret = a.slice();
  for (var i in a) {
    o[a[i]] = 1;
  }
  for (var i in b) {
    if (b[i] in o) {
      continue;
    }
    o[b[i]] = 1;
    ret.push(b[i]);
  }
  return ret;
}
module.exports = extend({
  noop: function(){},
  defaults: defaults,
  extend: extend,
  shuffle: shuffle,
  uniqConcat: uniqConcat,
}, require('./strftime'), require('./text'))
