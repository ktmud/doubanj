var consts = require('../consts');

var INTEREST_STATUS_ORDERED = consts.INTEREST_STATUS_ORDERED;
var INTEREST_STATUS_LABELS = consts.INTEREST_STATUS_LABELS;

function labelsList(ns, ss) {
  var labels = INTEREST_STATUS_LABELS[ns];
  var statuses = ss || INTEREST_STATUS_ORDERED[ns];
  return statuses.map(function(item) {
    return labels[item];
  }).join(',');
}
var ns_labels = {
  book: labelsList('book'),
};

var common_csvs = {
  // ratio of statuses
  r_status: function(ns, d) {
    var ret = ['label,value'];
    var labels = INTEREST_STATUS_LABELS[ns];
    var statuses = INTEREST_STATUS_ORDERED[ns];
    statuses.forEach(function(item) {
      if (d[item]) {
        ret.push(labels[item] + ',' + (d['ratio_' + item] || 0));
      }
    });
    return ret.join('\n');
  },
  by_updated_month: function(ns, d, ss, a, b) {
    ss  = ss && ss[0] !== 'all' ? ss : INTEREST_STATUS_ORDERED[ns];

    var th = '月,' + labelsList(ns, ss);
    var ret = [th];

    a = a || 0;

    d.interest.n_by_updated_year_month.slice(a, b).forEach(function(item) {
      var l = [[item._id.year, item._id.month].join('-')];
      ss.forEach(function(s) {
        l.push(item['status_' + s] || 0);
      });
      ret.push(l.join(','))
    })
    return ret.join('\n');
  },
};

function n_by_pubdate_decades(d, st) {
  st = st || 'all';
  d = d[st];

  if (!d) return;

  var ret = {};
  var _y, n = 0, l = d.n_by_pubdate_year.length;
  d.n_by_pubdate_year.forEach(function(item, i) {
    var y = item._id.year;
      y = y >= 2000 ? y : (Math.floor(y / 10) * 10 + 's');

    n += item.count;

    if (i + 1 == l) {
      ret[y] = n;
    } else if (!_y || y === _y) {
      _y = y;
    } else {
      ret[_y] = n;
      _y = y;
      n = 0;
    }
  });
  return ret;
}

var ns_csvs = {
  book: {
    by_pubdate: function(d) {
      var ret = ['年,数量'];
      d.all.n_by_pubdate_year.forEach(function(item) {
        ret.push(item._id.year + ',' + item.count)
      })
      return ret.join('\n');
    },
    by_pubdate_decades: function(data, ss) {
      ns = 'book';

      ss  = ss && ss[0] !== 'all' ? ss : INTEREST_STATUS_ORDERED[ns];

      var th = '月,' + labelsList(ns, ss);

      var dict = {};
      ss.forEach(function(st, i) {
        var d = n_by_pubdate_decades(data, st);
        if (!d) return;
        for (var y in d) {
          var arr = dict[y] || (dict[y] = []);
          arr[i] = d[y];
        }
      });

      var ret = Object.keys(dict);

      function fillup(r) {
        ss.forEach(function(item, i) {
          r[i] = r[i] || 0;
        });
      }

      ret = ret.sort().map(function(item) {
        var r = dict[item];
        fillup(r);
        r.unshift(item);
        return r.join(',');
      });
      ret.unshift(th);
      
      return ret.join('\n');
    }
  },
};

function export_csv(ns) {
  var csvs = ns_csvs[ns];
  return function() {
    var self = this;
    var args = [].slice.call(arguments);
    var k = args.shift();

    var ret = {};
    var stats = self[ns + '_stats'];
    if (!stats) return ret;

    args.unshift(stats);

    fn = csvs[k];
    if (!fn) {
      fn = common_csvs[k];
      args.unshift(ns);
    }
    return fn && fn.apply(self, args);
  }
}

/**
* Keywords treemap JSON 
*/
function export_keywords(ns) {
  return function(status) {
    status = status || 'all';

    var user = this;
    var stats = user[ns + '_stats'][status];
    if (!stats) return {};
    var ret = {
      _id: ns + '_' + status,
      children: []
    };
    var kids = ret.children;
    Object.keys(stats).forEach(function(k) {
      var tmp = k.split('_');
      if (tmp[0] === 'top' && tmp[1] !== 'tags') {
        kids.push({
          _id: tmp[1],
          children: stats[k]
        });
      }
    });
    return ret;
  }
}

function export_tags(ns) {
  return function(status) {
    status = status || 'all';

    var user = this;
    var stats = user[ns + '_stats'];
    if (!stats || !stats[status]) return {};

    var ret = {
      _id: ns + '_' + status,
      children: []
    };

    var kids = ret.children;

    if (stats[status].top_tags) {
      kids.push({
        _id: 'public_tags',
        children: stats[status].top_tags
      });
    }
    if (stats.interest.top_tags) {
      kids.push({
        _id: 'personal_tags',
        children: stats.interest.top_tags
      });
    }
    return ret;
  }
}

module.exports = {
  notReady: function() {
    return this.stats_fail || this.invalid || this.stats_status !== 'succeed';
  },
  book_tags: export_tags('book'),
  book_keywords: export_keywords('book'),
  book_csv: export_csv('book'),
};
