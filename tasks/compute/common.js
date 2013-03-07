var util = require('util');

var debug = require('debug');
var log = debug('dbj:aggregate:log');
var error = debug('dbj:aggregate:error');

var raven = require('../../lib/raven');
var extend = require('../../lib/utils').extend;

var conf_interest = {
  top: ['tags'],
  most: [{ 'commented': -1 }],
  date: {
    'updated': {
      periods: ['year', 'month', 'year_month', 'dayOfMonth', 'dayOfWeek'],
      group_by: 'status::ing,done,wish'
    },
  }
};

function AggStream(opts) {
  opts = opts || {};

  this.uid = opts.uid;
  this.params = this.parseParam(opts.params);
  this.prefilter = opts.prefilter;
  this.collection = opts.collection;
  this._closeOnDrain = ('closeOnDrain' in opts) ? opts.closeOnDrain : true;
  this.results = {};
  this.failures = {};
}
util.inherits(AggStream, require('events').EventEmitter);

AggStream.prototype.run = function(agg_id) {
  var params = this.params;
  if (!agg_id) {
    for (var p in params) {
      this.run(p);
    }
    return;
  }
  if (!(agg_id in params)) return;

  var self = this;
  var col = self.collection;
  var param = params[agg_id];
  if (self.prefilter instanceof Array) {
    param = self.prefilter.concat(param);
  } else if (self.prefilter) {
    param = [self.prefilter].concat(param);
  };
  col.aggregate(param, function(err, result) {
    //log(JSON.stringify(param));
    if (err) {
      raven.error(err, {
        message: 'aggregation failed',
        tags: { task: 'aggregate' },
        extra: { agg_id: agg_id, uid: self.uid }
      });
      self.emit('error', err);
      self.failures[agg_id] = err;
    }
    if (!result || !result.length) {
      log('%s for %s got empty results.', agg_id, self.uid);
    }
    self.results[agg_id] = result;

    if (self.percent() >= 100) self.drain();
  });
};
AggStream.prototype.close = function() {
  this.emit('end');
  this.emit('close');
  //console.log(this.results, this.failures);
};
AggStream.prototype.drain = function() {
  this.emit('drain');
  if (this._closeOnDrain) this.close();
};
AggStream.prototype.percent = function() {
  var params = this.params;
  var dones = this.results;
  var failures = this.failures;
  var whole = Object.keys(params).length;
  var percent = 0;
  for (var k in this.params) {
    if (k in dones) {
      percent++;
    } else if (k in failures) {
      percent++;
    }
  }
  return (percent / whole * 100);
};
AggStream.prototype.hasFailure = function() {
  return Object.keys(this.failures).length > 0;
}
AggStream.prototype.parseParam = aggParam;

/**
* generate params for mongodb aggregation
*/
function aggParam(conf) {
  var param = conf;
  if ('top' in conf) {
    var ptop = conf.top;
    var ptop_u = conf.$top_u || []; // props don't need unwind
    var ptop_k = conf.$top_k; // need to flatten the object, get key
    var limit = conf.$top_limit;

    ptop.forEach(function(p) {
      var r = aggTop(p, ptop_u.indexOf(p) == -1, limit);
      var prj = {};
      var k = ptop_k && ptop_k[p];
      if (k) {
        // to flatten the object
        //
        // Now we have:
        // docs = [{
        //    p: {
        //       k: 'abc'
        //    }
        // }]
        //
        // But we want:
        //
        // docs = [{
        //   p: 'abc'
        // }]
        prj[p] = '$' + p + '.' + k;
      } else {
        prj[p] = 1;
      }
      // filter to only the necessary fields
      r.unshift({ $project: prj });
      param['top_' + p] = r;
    });
    delete param['top'];
    delete param['$top_u'];
    delete param['$top_k'];
    delete param['$top_limit'];
  }
  if ('most' in conf) {
    var pmost = conf.most;
    var pmost_limit = conf.$most_limit;
    var pmost_fields = conf.$most_fields || { 'id': 1, '_id': 0 };

    function get_fields(p) {
      var f = {};
      f[p] = 1;
      extend(f, pmost_fields);
      return f;
    }
    pmost.forEach(function(p) {
      if (typeof p === 'object') {
        var n = p['$name'];
        var l = p['$limit']
        var f = p['$fields'];
        if (!n) return;
        delete p['$name'];
        delete p['$limit'];
        delete p['$fields'];
        if (!f) {
          f = get_fields(n);
        }
        param[n] = aggSort(p, null, l || pmost_limit, f);
      } else {
        var f = get_fields(p);
        param['most_' + p] = aggSort(p, -1, pmost_limit, f);
        param['least_' + p] = aggSort(p, 1, pmost_limit, f);
      }
    });
    delete conf['most'];
    delete conf['$most_limit']
    delete conf['$most_fields']
  }
  if ('range' in conf) {
    var prange = conf.range;
    for (var p in prange) {
      param['n_by_' + p] = aggRange(p, prange[p]);
    }
    delete param['range'];
  }
  if ('date' in conf) {
    var pdate = conf.date;
    for (var p in pdate) {
      var obj = pdate[p];
      var periods = obj.periods;
      var group_by = obj.group_by;
      periods.forEach(function(period) {
        param[['n', 'by', p, period].join('_')] = aggDate(p, period, group_by);
      });
    }
    delete param['date'];
  }
  //console.log(param);
  return param;
}
function aggSort(p, desc_asc, limit, fields) {
  limit = limit || 20;
  if (typeof p !== 'object') {
    var obj = {};
    obj[p] = desc_asc;
    p = obj;
  }
  var match_q = {};
  Object.keys(p).forEach(function(item, i) {
    match_q[item] = {
      $not: {
        $type: 10
      }
    };
  });
  // only output the id (which is subject_id or user_id in douban)
  return [{ $match: match_q }, { $sort: p }, { $limit: limit },  { $project: fields }];
}
function aggTop(p, unwind, limit) {
  limit = limit || 20;
  var name = '$' + p;
  var ret = [
    { $group: { _id: name, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ];
  if (unwind) {
    ret.unshift({ $unwind: name });
  }
  return ret;
}
function aggRange(p, dots) {
  function addcond(items) {
    var n = items.shift();
    if (!n) return Infinity;
    return {
      $cond: [ { $lt: ['$' + p, n] }, n, addcond(items) ]
    }
  }
  return [
    {
      $project: {
        range: addcond(dots)
      }
    }, {
      $group: {
        _id: "$range",
        count: { $sum: 1 }
      }
    }, {
      $sort: {
        _id: 1
      }
    }
  ];
}
function aggDate(p, period, group_by) {
  var prd = {};
  period = period.split('_');
  // will output something like:
  // prd = {
  //   $year: '$pubdate'
  // }
  period.forEach(function(i) {
    prd[i] = {};
    prd[i]['$' + i] = '$' + p;
  });
  var _id = '$period';
  var prj = {
    _id: 0,
    period: prd
  }
  var grp = {
    _id: _id,
    count: { $sum: 1 }
  };
  var sort = {
    '_id': 1
  }
  if (group_by) {
    var tmp = group_by.split('::');
    var k = tmp[0];
    var vals = tmp[1].split(',');
    vals.forEach(function(item) {
      var prj_key = k + '_' + item;
      prj[prj_key] = {
        $cond: [{ $eq: ['$' + k, item] }, 1, 0]
      };
      grp[prj_key] = {
        $sum: '$' + prj_key
      };
    });
  }
  var ret = [{
    $project: prj
  }, {
    $group: grp 
  }, {
    $sort: sort 
  }];
  return ret;
}

var agg_param_interest = aggParam(conf_interest);

module.exports = {
  AggStream: AggStream,
  aggParam: aggParam,
  conf_interest: conf_interest,
  agg_param_interest: agg_param_interest,
};
