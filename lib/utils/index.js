
function realen(str) {
  var l = str.length
  return l;
}

function simple_trunc(str, limit) {
  var l = str.length;
  if (l > limit) {
    return str.slice(0, limit - 3) + '..';
  }
  return str;
}
// double width characters trunc
function trunc(str, limit, eclipsis) {
  if (typeof eclipsis === 'undefined') {
    eclipsis = '..';
  }
  var l = str.length;
  if (l * 2 < limit) return str;
  var i = 0;
  limit = limit * 2;
  while (limit > 0) {
    limit--;
    if (str.charCodeAt(i) > 2000) limit--;
    i++;
  }
  return str.slice(0, i) + (i < l ? eclipsis : '');
}

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

module.exports = {
  time_elapse: function time_elapse(date, now) { 
     now = now || new Date();
    var y = now.getFullYear() - date.getFullYear();
    var m = now.getMonth() - date.getMonth();
    if (m < 0) {
      y--;
      m = m + 12;
    }

    date.setFullYear(date.getFullYear() + y);
    date.setMonth(date.getMonth() + m);

    var timeDiff = now - date;

    if (timeDiff < 0 ) {
      m--;
      var mo = date.getMonth();
      if (mo == 1) {
        date.setFullYear(date.getFullYear() - 1); 
        date.setMonth(12); 
      } else {
        date.setMonth(mo - 1);
      }
      timeDiff = now - date;
    }
    // strip the miliseconds
    timeDiff = timeDiff / 1000;

    // get seconds
    var sec = Math.round(timeDiff % 60);

    // remove seconds from the date
    timeDiff = timeDiff / Math.round(60);

    // get minutes
    var mi = Math.round(timeDiff % 60);

    // remove minutes from the date
    timeDiff = timeDiff / Math.round(60);

    // get hours
    var h = Math.round(timeDiff % 24);

    // remove hours from the date
    timeDiff = Math.round(timeDiff / 24);

    // the rest of timeDiff is number of days
    var d = timeDiff;

    return (y ? y + '年' : '') +
      (m ? m  + '个月' : '') +
      (d ? d + '天' : '') +
      (h ? h + '小时' : '') +
      (mi ? mi + '分' : '') + sec + '秒';
  },
  strftime: require('./strftime'),
  trunc: trunc,
  simple_trunc: simple_trunc,
  extend: extend,
}
