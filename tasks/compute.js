/*
* compute the stastics
*/
var debug = require('debug');
var log = debug('dbj:task:compute:info');
var error = debug('dbj:task:compute:error');

var cwd = process.cwd();

var consts = require(cwd + '/models/consts');
var task = require(cwd + '/lib/task');

var user_ensured = require(cwd + '/models/user').ensured;
var Interest = require(cwd + '/models/interest').Interest;

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

function counted_list(col) {
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

function page_range(pages) {
  var n = parseFloat(pages, 10);
  if (isNaN(n)) {
    return 'NaN';
  }
  if (n < 100) return '100';
  if (n < 300) return '300';
  if (n < 500) return '500';
  if (n < 800) return '800';
  return 'MAX';
}
function price_range(price) {
  n = parse_price(price);
  if (isNaN(n)) {
    //console.log('=====NaN: ', price);
    return 'NaN';
  }
  if (n < 10) return '10';
  if (n < 20) return '20';
  if (n < 40) return '40';
  if (n < 60) return '60';
  if (n < 80) return '80';
  if (n < 100) return '100';
  if (n < 200) return '200';
  if (n < 500) return '500';
  return 'MAX';
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
  if (!pages) return 0;
  var n = parseInt(pages, 10);
  if (isNaN(n)) log('invalid page %s', pages);
  return n;
}
function parse_rating_raters(rating) {
  return rating && rating.numRaters;
}

var time_funcs = {
  year: function(date) { return date.getFullYear() + '' },
  month: function(date) { return date.getFullYear() + '-' + date.getMonth() },
  monthday: function(date) { return date.getDate() + '' },
  weekday: function(date) { return date.getDay() + '' },
  hour: function(date) { return date.getHours() + '' },
};

function analyzeInterests(interests) {
  var r = { 
    total: interests.length
    , public_tags: []
    , private_tags: []
    , authors: []
    , translators: []
    , publishers: []

    , most_commented: []
    , most_expensive: []
    , most_paged: []
    , most_rated: []

    , n_by_rating: {}
    , n_by_status: {}

    , n_by_price: {}
    , n_by_pages: {}
    , n_by_pubdate: {}

    , n_by_month: {}
    , n_by_year: {}
    , n_by_monthday: {}
    , n_by_weekday: {}
    , n_by_hour: {}
  };

  var n_wish = n_ing = n_done = 0
    , most_commented = {}
    , most_paged = {}
    , most_rated = {}
    , most_expensive = {}
    , authors = {}
    , translators = {}
    , publishers = {}
    , public_tags = {}
    , private_tags = {};

  interests.forEach(function(item) {
    var s = item.subject;

    count_length(item, most_commented, 'comment');

    var date = new Date(item.updated);

    for (var f in time_funcs) {
      count(date, r['n_by_' + f], time_funcs[f]);
    }

    count(item.status, r.n_by_status);

    if (item.rating) {
      count(item.rating.value, r.n_by_rating);
      count('n_' + item.status + '_rate' + item.rating.value, r);
    }

    if (s.pubdate) {
      var pubdate = new Date(s.pubdate.replace('年', '-').replace('月', '-').replace('日', ' ').replace('第一版', ''));
      if (isNaN(+pubdate)) log('invalid date: %s', s.pubdate);
      pubdate && count(pubdate.getFullYear() + '', r.n_by_pubdate);
    }
    count(s.pages, r.n_by_pages, page_range);
    count(s.price, r.n_by_price, price_range);

    count_max(s, most_paged, 'pages', parse_pages);
    count_max(s, most_expensive, 'prices', parse_price);
    count_max(s, most_rated, 'rating', parse_rating_raters);

    count(s.tags, public_tags, 'name');
    count(item.tags, private_tags);
    count(s.publisher, publishers);
    count(s.author, authors);
    count(s.translator, translators);
  });
  r.public_tags = counted_list(public_tags);
  r.private_tags = counted_list(private_tags);
  r.authors = counted_list(authors);
  r.translators = counted_list(authors);
  r.publishers = counted_list(publishers);
  // has the longest comment
  r.most_commented = counted_list(most_commented);
  r.most_expensive = counted_list(most_expensive);
  r.most_paged = counted_list(most_paged);
  // has the most rating users number
  r.most_rated = counted_list(most_rated);
  //console.log(r);
  return r;
}

var compute, _compute;
compute = task.compute_pool.pooled(_compute = function(computings, arg, next) {
  user_ensured(function(arg) {
    var user = arg.user;
    var error_cb = function(err) {
      error('compute for %s failed: %s', user && user.uid || user, err);
      if (err.stack) { console.log(err.stack); }
      arg.error && arg.error(err);
      if (err !== 'RUNNING') {
        user.update({
          stats: null,
          stats_p: 0
        });
      }
      next();
    };
    var succeed_cb = arg.success;

    if (!user) return error_cb('NO_USER');
    // already running
    if (user.stats_p && user.stats_p !== 100 && !arg.force) return error_cb('RUNNING');
    // not ready
    if (user.invalid) return error_cb(user.invalid);
    if (user.last_synced_status !== 'succeed') return error_cb('NOT_READY');

    // in queue means 5 percent of work has been done
    user.update({ stats_p: 5 });

    // find all collected books
    Interest.findByUser('book', user.uid, function(err, data) {
      // getting books failed
      if (err) {
        error_cb(err);
        return;
      }
      var stats = user.stats || {}, book_stats;
      try {
        book_stats = analyzeInterests(data)
      } catch (e) {
        return error_cb(e);
      }
      // book stats is ready
      stats['book'] = new Date();

      user.update({
        stats: stats,
        stats_p: 100,
        book_stats: book_stats
      }, function(err) {
        if (err) {
          return error_cb(err);
        }
        succeed_cb && succeed_cb(user);
        next();
      });
    }, {
      attach_subject: true
    });
  })(arg);
});

module.exports = compute;
