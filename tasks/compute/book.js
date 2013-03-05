/**
* Book Interests Analytics Configuration
*/
var utils = require('../utils');
var common = require('./common');
var debug = require('debug');
var log = debug('dbj:task:compute:book:info');
var error = debug('dbj:task:compute:book:error');

var AggStream = common.AggStream;
var conf_interest = common.conf_interest;

var consts = require(process.cwd() + '/models/consts');

var interest_statuses = consts.INTEREST_STATUS_ORDERED.book;

var conf_book = {
  // count by appearence
  top: ['tags', 'author', 'translator', 'publisher'],
  // doesn't need unwind 
  $top_u: ['publisher'],
  $top_k: {
    'tags': 'name'
  },
  $top_limit: 30,
  // sorting by prop value, return a 'most_xxx' list
  // by default, will count 'least_xxx' too
  // can set `[ { pages: -1 } ]` (means descending by pages) to avoid.
  // use 
  //   {
  //     '$name': 'most_abced',
  //     '$limit': 10,
  //     'prop1': 1,
  //     'prop2': -1
  //   }
  // for more advanced settings
  most: ['pages', 'rated', 'raters', {
    price: -1,
    $name: 'most_price',
    $fields: { id: 1, _id: 0, price: 1, ori_price: 1, title: 1 }
  }, {
    price: 1,
    $name: 'least_price',
    $fields: { id: 1, _id: 0, price: 1, ori_price: 1, title: 1 }
  }],
  $most_fields: { id: 1, _id: 0, title: 1 },
  $most_limit: 20,
  range: {
    'pages': [100, 300, 500, 800],
    'price': [10, 20, 40, 60, 80, 100, 200, 500],
  },
  date: {
    'pubdate': {
      periods: ['year']
    }
  }
};
var agg_param_book = common.aggParam(conf_book);
var agg_param_interest = common.agg_param_interest;

module.exports = function(db, user, cb, ondata) {
  var col_s = db.collection('book');
  var col_i = db.collection('book_interest');

  var uid = user.uid || user.id;
  var ifilter = {
    $or: [
      { 'uid': uid },
      { 'user_id': user.id }
    ]
  };

  var results = {};

  var called = false;
  var err_cb = function(err) {
    error('Aggregation failed: %s', err);
    if (called) return;
    called = true;
    cb && cb(err);
  };

  var n_phrase = 1;

  function tick() {
    var percent = Object.keys(results).length / n_phrase * 100;
    if (percent >= 100) {
      finish();
    } else {
      ondata && ondata(percent);
    }
  }
  function finish() {
    var total = results.total = results.all.total;
    interest_statuses.forEach(function(item) {
      var n = results[item];
      n = n && n.total || 0;
      results['n_' + item] = n;
      results['ratio_' + item] = (n / total * 100).toFixed(2);
    });
    cb(null, results);
  }

  // find out all collected books by user
  col_i.find(ifilter, { fields: { subject_id: 1, status: 1 } }).toArray(function(err, docs) {
    if (err) return err_cb(err);

    // filter out subject ids by status
    var all_sids = [];
    var by_status = {};
    docs.forEach(function(i) {
      all_sids.push(i.subject_id);
      var arr = by_status[i.status] || [];
      arr.push(i.subject_id);
      by_status[i.status] = arr;
    });
    by_status['all'] = all_sids;

    function agg_by_status(i_status) {
      if (!(i_status in by_status)) return;
      var sids = by_status[i_status];

      log('Agg %s book for %s...', i_status, uid);

      n_phrase++;

      var agger = new AggStream({
        uid: uid,
        params: agg_param_book,
        collection: col_s,
        prefilter: { $match: { id: { $in: sids } }, }
      });

      agger.on('error', err_cb);
      agger.once('close', function() {
        var r = this.results;
        r.total = sids.length;
        results[i_status || 'all'] = r;
        tick();
      });

      agger.run();
    }

    for (var s in by_status) agg_by_status(s);

    calcInterests();
  });

  function calcInterests() {
    var iagger = new AggStream({
      uid: uid,
      params: agg_param_interest,
      collection: col_i,
      prefilter: { $match: ifilter } 
    });
    iagger.on('error', err_cb);
    iagger.once('close', function() {
      results['interest'] = this.results;
      tick();
    });
    log('Agg book interests for %s...', uid);
    iagger.run();
  }
};
