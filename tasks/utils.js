var raven = require('../lib/raven');

var currency_trans = [
  [/^\s*(USD?\$?|\$)[\.\s]*/i, 6.23],
  [/^\s*(HKD?\$?|港币)[\.\s]*/i, 0.8],
  [/^\s*CNY\s*/i, 1],
  [/^\s*(GBP?\£?|\£)[\.\s]*/i, 9.44],
  [/^\s*(NTD?\$?)[\.\s]*/i, 0.21],
  [/^\s*(CDN|CAD)[\.\s]*\$?\s*/i, 6.1]
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
  if (!pages || pages.search('册') > -1) return null;
  pages = pages.replace(/^\s*大?约\s*/, '');
  var n = parseInt(pages, 10);
  if (isNaN(n)) raven.message('invalid page %s', pages, { tags: { parsing: 'pages' }, level: 'warn' });
  return n;
}
function isDigit(str) {
  return /^\d+$/.test(str);
}
function parse_date(d) {
  d = d || '';
  d = d.replace(/[\s\-、\,－]+/, '-', 2).replace(/[^0-9\-\s\:a-zA-Z]/g, '').trim();

  if (isDigit(d)) {
    d = [d.slice(0, 4), d.slice(4, 6) || 1, d.slice(6) || 1].join('-');
  }

  var r = new Date(d);
  if (d && isNaN(+r)) {
    console.log('invalid date %s', d);
    raven.message('invalid date %s', d, { tags: { parsing: 'date' }, level: 'warn' });
  }
  return r;
}
function parse_pubdate(d) {
  d = d || '';
  d = d.replace('年', '-').replace('月', '-').replace('日', ' ').replace(/[\-\s]*(第.*版|版|重印|第.*次印刷)/g, '');
  return parse_date(d);
}
function parse_publisher(p) {
  if (!p) return null;
  return p;
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
  'publisher': parse_publisher,
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
