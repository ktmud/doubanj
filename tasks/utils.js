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

  price = dbc2sbc(price);

  var n = parseFloat(price, 10);
  if (!isNaN(n)) return null;

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
  pages = dbc2sbc(pages);
  var n = parseInt(pages, 10);
  if (isNaN(n)) return null;
  return n;
}
function isDigit(str) {
  return /^\d+$/.test(str);
}
function parse_date(str) {
  var d = str || '';

  d = dbc2sbc(d);

  var i = 0;
  d = d.trim().replace(/[\s\-、\,－]+/g, function(m) {
    i++;
    if (i > 2) {
      return ' ';
    }
    return '-';
  }).replace(/[^0-9\-\s\:a-zA-Z]/g, '');

  var r;
  if (isDigit(d)) {
    var _d = [d.slice(0, 4), d.slice(4, 6) || 1, d.slice(6) || 1].join('-');
    r = new Date(_d);
    if (isNaN(+r)) {
      d = [d.slice(0, 4), d.slice(4, 5) || 1, d.slice(5) || 1].join('-');
    } else {
      if　(r.getFullYear() > 3000) {
        // 890606
        d = [d.slice(0,2), d.slice(2,4) || 1, d.slice(4, 6) || 1].join('-');
      }
      d = _d;
    }
  }

  r = new Date(d);
  if (isNaN(+r)) return null;
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
  var k, oril
  for (k in parsers) {
    if (k in s) {
      ori = s['ori_' + k] = s[k]; // backup original value
      s[k] = parsers[k](s[k]);
      if (s[k] && ori && s[k] === null) {
        console.log('invalid %s %s', k, ori); 
        raven.message('invalid %s %s', k, ori, {
          tags: { parsing: k },
          extra: {
            subject: s.id
          },
          level: 'warn'
        });
      }
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

function dbc2sbc(str) {
  return str.replace(/[\uff01-\uff5e]/g,function(a){return String.fromCharCode(a.charCodeAt(0)-65248);}).replace(/\u3000/g," ");
}

module.exports = {
  parsers: parsers,
  norm_subject: norm_subject,
  norm_interest: norm_interest,
  time_funcs: time_funcs
};
