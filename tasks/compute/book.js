/**
* Book Interests Analytics Configuration
*/
var async = require('async')
var utils = require('../utils')
var common = require('./common')
var debug = require('debug')
var log = debug('dbj:task:compute:book:info')
var error = debug('dbj:task:compute:book:error')
var verbose = debug('dbj:task:compute:book:verbose')

var AggStream = common.AggStream

var cwd = process.cwd()
var raven = require(cwd + '/lib/raven')
var consts = require(cwd + '/models/consts')

var STATUSES = consts.INTEREST_STATUS_ORDERED.book

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
}
var AGG_PARAM_BOOK = common.aggParam(conf_book)
var AGG_PARAM_INTEREST = common.agg_param_interest

var DB_INTEREST = 'book_interest'
var DB_BOOK = 'book'

module.exports = function(db, user, callback, progress) {
  callback = callback || function() {}
  progress = progress || function() {}

  var uid = user.uid || user.id

  // find out all collected books by user
  db.collection(DB_INTEREST).find(
    { user_id: user._id },
    { fields: { subject_id: 1, status: 1 } }
  ).toArray(function(err, docs) {
    if (err) return callback(err);
    run(sidsByStatus(docs))
  })

  function sidsByStatus(docs) {
    // filter out subject ids by status
    var all_sids = []
    var by_status = {}
    docs.forEach(function(i) {
      all_sids.push(i.subject_id)
      var arr = by_status[i.status] || []
      arr.push(i.subject_id)
      by_status[i.status] = arr
    })
    by_status['all'] = all_sids
    return by_status;
  }

  var total_step;

  function agg(i, name, options) {
    return function(callback) {
      var agger = new AggStream(options)
      agger.once('error', callback)
      agger.once('end', function() {
        this.fillup()
        progress(i / total_step * 100)
        callback(null, this.results)
      })
      log('Agg %s for %s ...', name, uid)
      agger.run()
    }
  }

  function run(sids_by_status) {
    var statuses = ['all'].concat(STATUSES)
    var actions = statuses.map(function(st, i) {
      var sids = sids_by_status[st]
      if (!sids) {
        return function(next) { next(null) }
      }
      var options = {
        uid: uid,
        params: AGG_PARAM_BOOK,
        collection: DB_BOOK,
        prefilter: {
          $match: { _id: { $in: sids } },
        }
      }
      return agg(i + 1, st + ' book', options)
    })

    actions.push(agg(actions.length + 1, 'book interest', {
      uid: uid,
      params: AGG_PARAM_INTEREST,
      collection: DB_INTEREST,
      prefilter: {
        $match: { user_id: user._id }
      }
    }))

    total_step = actions.length

    async.series(actions, function(err, computed) {
      if (err) return callback(err)

      var interest = computed.pop()
      var n_all = sids_by_status['all'].length

      var results = {
        total: n_all,
        interest: interest
      }

      statuses.forEach(function(item, i) {
        results[item] = computed[i]
        var n = sids_by_status[item]
        n = n && n.length || 0
        results['n_' + item] = n
        results['ratio_' + item] = (n / n_all * 100).toFixed(2)
      })
      callback(null, results)
    })
  }
}
