var consts = require('../consts');

var INTEREST_STATUS_ORDERED = consts.INTEREST_STATUS_ORDERED;
var INTEREST_STATUS_LABELS = consts.INTEREST_STATUS_LABELS;

function labelsList(ns) {
  var labels = INTEREST_STATUS_LABELS[ns];
  var statuses = INTEREST_STATUS_ORDERED[ns];
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
  by_updated_month: function(ns, d, a, b) {
    var th = '月,' + ns_labels[ns];
    var ret = [th];
    var statuses = INTEREST_STATUS_ORDERED[ns];

    a = a || 0;

    d.interest.n_by_updated_year_month.slice(a, b).forEach(function(item) {
      var l = [[item._id.year, item._id.month].join('-')];
      statuses.forEach(function(s) {
        l.push(item['status_' + s] || 0);
      });
      ret.push(l.join(','))
    })
    return ret.join('\n');
  },
};

var ns_csvs = {
  book: {
    by_pubdate: function(d) {
      var ret = ['年,数量'];
      d.all.n_by_pubdate_year.forEach(function(item) {
        ret.push(item._id.year + ',' + item.count)
      })
      return ret.join('\n');
    },
    by_pubdate_decades: function(d, st) {
      st = st || 'all';
      var ret = ['年代,数量'];
      var _y, n = 0, l = d[st].n_by_pubdate_year.length;
      d[st].n_by_pubdate_year.forEach(function(item, i) {
        var y = item._id.year;
         y = y >= 2000 ? y : (Math.floor(y / 10) * 10 + 's');

        n += item.count;

        if (i + 1 == l) {
          ret.push(y + ',' + n);
        } else if (!_y || y === _y) {
          _y = y;
        } else {
          ret.push(_y + ',' + n);
          _y = y;
          n = 0;
        }
      })
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

module.exports = {
  book_csv: export_csv('book'),
};
