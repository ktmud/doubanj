var debug = require('debug');
var log = debug('dbj:task:log');
var error = debug('dbj:task:error');

function count(items, col, k) {
  if (!items || !col) return;

  var get_key;
  switch(typeof k) {
    case 'function':
      get_key = k;
      break;
    case 'undefined':
      get_key = function(item) { return item };
      break
    default:
      get_key = function(item) { return item[k.toString()] };
  }

  function c(t) {
    t = get_key(t);
    col[t] = col[t] || 0;
    col[t]++;
  }

  if (items instanceof Array) {
    items.forEach(c);
  } else {
    c(items);
  }
}
function count_length(item, col, k, uniq_key) {
  if (!item || !item[k]) return;
  col[item[uniq_key || 'id']] = item[k].length;
}
function count_max(item, col, k, parser, uniq_key) {
  if (!item || !item[k]) return;
  col[item[uniq_key || 'id']] = parser(item[k]);
}

function tops(col) {
  var ks = Object.keys(col);
  ks = ks.sort(function(a, b) {
    return col[b] - col[a];
  });
  ks = ks.slice(0, 20);
  return ks.map(function(item) {
    return {
      name: item,
      count: col[item]
    }
  });
}

function analyzeInterests(ns, interests) {
  var subjects = interests.map(function(i) { return i.subject; });
  var ret = analyze(subjects, configs[ns].subjects);
  var iret = analyze(interests, configs[ns].interests || common.config.interests);
  for (var k in iret) {
    ret[k] = iret[k];
  }
  return ret;
}

/**
* @param {Array} list - the list of interests
* @param {Object} ptop - which props will be counted for most appearence
* @param {Object} pmax - which props will be counted for for max value
* @param {Object} pgroup - which props will count in group appearence
*/
function analyze(list, opts) {
  var ptop = opts.ptop;
  var pmax = opts.pmax;
  var pgroup = opts.pgroup;

  var r = { 
    total: interests.length
  };

  list.forEach(function(item) {
    var s = item.subject;

  });
  //console.log(r);
  return r;
}

var currency_trans = [
  [/^\s*(USD?\$?|\$)\s*/i, 6.23],
  [/^\s*(HKD?\$?|港币)\s*/i, 0.8],
  [/^\s*CNY\s*/i, 1],
  [/^\s*(GBP?\£?|\£)\s*/i, 9.44],
  [/^\s*(NTD?\$?)\s*/i, 0.21],
  [/^\s*(CDN|CAD)\s*\$?\s*/i, 6.1]
];
function parse_price(price) {
  if (!price) return NaN;

  var n = parseFloat(price, 10);
  if (!isNaN(n)) return n;

  for (var i = 0, l = currency_trans.length; i < l; i++) {
    var item = currency_trans[i];
    if (item[0].test(price)) {
      var replaced = price.replace(item[0], '');
      //log('%s replaced to %s', price, replaced);
      return parseFloat(replaced, 10) * item[1];
    }
  }

  return n;
}
function parse_pages(pages) {
  if (!pages) return null;
  var n = parseInt(pages, 10);
  if (isNaN(n)) log('invalid page %s', pages);
  return n;
}
function parse_date(d) {
  var r = new Date(d);
  if (isNaN(+r)) {
    log('invalid date: %s', d);
  }
  return r;
}
function parse_pubdate(d) {
  d = d || '';
  d = d.replace('年', '-').replace('月', '-').replace('日', ' ').replace('第一版', '');
  return parse_date(d);
}
var time_funcs = {
  year: function(date) { return date.getFullYear() + '' },
  month: function(date) { return date.getFullYear() + '-' + date.getMonth() },
  monthday: function(date) { return date.getDate() + '' },
  weekday: function(date) { return date.getDay() + '' },
  hour: function(date) { return date.getHours() + '' },
};

var normalize_status = {
  'reading': 'ing',
  'read': 'done',
  'wish': 'wish',
};
function norm_status(s) {
  return normalize_status[s];
}
var parsers = {
  'pubdate': parse_pubdate,
  'pages': parse_pages,
  'price': parse_price,
};

function norm_subject(s, ns) {
  if (ns) {
    s.type = ns;
  } else if ('book_id' in s) {
    s.type = book;
  }
  for (var k in parsers) {
    if (k in s) {
      s['ori_' + k] = s[k]; // backup original value
      s[k] = parsers[k](s[k]);
    }
  }
  if (s.rating) {
    s.raters = s.rating.numRaters;
    // zero is ignored
    s.rated = parseFloat(s.rating.average, 10) || null;
  }
  return s;
}
function norm_interest(i) {
  i.status = normalize_status[i.status];
  i.commented = i.comment && i.comment.length || 0;
  i['updated'] = parse_date(i['updated']);
  return i;
}

module.exports = {
  parsers: parsers,
  norm_subject: norm_subject,
  norm_interest: norm_interest,
  time_funcs: time_funcs
};
