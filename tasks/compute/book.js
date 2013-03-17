/**
* Book Interests Analytics Configuration
*/
var utils = require('../utils');
var common = require('./common');
var debug = require('debug');
var log = debug('dbj:task:compute:book:info');
var error = debug('dbj:task:compute:book:error');

var AggStream = common.AggStream;

var cwd = process.cwd();
var raven = require(cwd + '/lib/raven');
var consts = require(cwd + '/models/consts');

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
    $fields: { price: 1, ori_price: 1, title: 1 }
  }, {
    price: 1,
    $name: 'least_price',
    $fields: { price: 1, ori_price: 1, title: 1 }
  }],
  $most_fields: { title: 1 },
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

var DB_INTEREST = 'book_interest';
var DB_BOOK = 'book';
module.exports = function(db, user, cb, ondata) {
  var col_s = db.collection(DB_BOOK);
  var col_i = db.collection(DB_INTEREST);

  var uid = user.uid || user.id;
  var ifilter = { 'user_id': user._id }

  var results = {};
  var last_err = null;

  var called = false;
  var err_cb = function(err) {
    last_err = err;
    error('Aggregation failed: %s', err);
    //if (called) return;
    //called = true;
    //cb && cb(err);
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
    cb(last_err, results);
  }

  // find out all collected books by user
  col_i.find(ifilter, { fields: { subject_id: 1, status: 1 } }).toArray(function(err, docs) {
    if (err) {
      raven.error(err, {
        message: 'getting interests failed',
        tags: { task: 'aggregate' },
        extra: { stage: 'getting interest', uid: uid }
      });
      cb && cb(err);
      return;
    }

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

      log('Agg %s book for %s ...', i_status, uid);

      n_phrase++;

      var agger = new AggStream({
        uid: uid,
        params: agg_param_book,
        collection: DB_BOOK,
        prefilter: { $match: { _id: { $in: sids } }, }
      });

      agger.once('error', err_cb);
      agger.once('close', function() {
        this.fillup();

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
      collection: DB_INTEREST,
      prefilter: { $match: ifilter } 
    });
    iagger.once('error', err_cb);
    iagger.once('close', function() {
      this.fillup();
      results['interest'] = this.results;
      tick();
    });
    log('Agg book interests for %s...', uid);
    iagger.run();
  }
};
