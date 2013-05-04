var central = require('../../lib/central');
var mongo = central.mongo;

var debug = require('debug');
var log = debug('dbj:toplist:by_tag:log');
var verbose = debug('dbj:toplist:by_tag:verbose');
var error = debug('dbj:toplist:by_tag:error');

// reduce to top 100 subjects
var reduce = function(tags, vals) { 
  var ret = [];
  vals.forEach(function(item, i) {
    if (item.arr) {
      ret.concat(item.arr);
    } else {
      ret.push(item);
    }
  });
  ret = ret.sort(function(a, b) {
    return b.count - a.count;
  }).slice(0, 100);

  return { arr: ret };
};

var finalize = function(key, reduced) {
  if (reduced.arr) return reduced.arr;
  return [reduced];
};

function users_by_tag(ns, status, done) {
  done = done || function(){};

  if (!ns || !status) return done(new Error('Namespace and status needed'));
  
  var stats_status = status || 'all';
  
  // map out all the tags
  var map = function() {
    if (!this[ns + '_stats']) return;
    var result = this[ns + '_stats'][stats_status];
    var top_tags = result && result.top_tags;

    var user_id = this._id;

    if (top_tags) {
      top_tags.forEach(function(item, i) {
        emit(item._id, { _id: user_id, count: item.count });
      });
    }
  };

  var out_coll = ['top', ns, status, 'user_by_tag'].join('_');

  mongo.queue(function(db, next) {
    db.collection('user').mapReduce(map, reduce, {
      scope: {
        ns: ns,
        stats_status: stats_status
      },
      finalize: finalize,
      //out: { inline: 1 },
      out: { replace: out_coll },
    }, function(err, coll) {
      next();
      if (err) {
        error('top %s %s users by tag failed: ', ns, stats_status, err)
        return done(err);
      }
      log('[%s] generated.', out_coll);
      done();
    });
  }, 5);
}

function subjects_by_tag(ns, done) {
  done = done || function(){};

  if (!ns) return done(new Error('Namespace needed'));
  
  // map out all the tags
  var map = function() {
    if (!this.tags || !this.tags.length) return;

    var id = this._id;
    this.tags.forEach(function(item, i) {
      emit(item.name, { _id: id, count: item.count });
    });
  };
  var out_coll = ['top', ns, 'by_tag'].join('_');

  mongo.queue(function(db, next) {
    db.collection(ns).mapReduce(map, reduce, {
      //out: { inline: 1 },
      finalize: finalize,
      out: { replace: out_coll },
    }, function(err, coll) {
      next();
      if (err) {
        error('top %s by tag failed: ', ns, err)
        return done(err);
      }
      log('[%s] generated.', out_coll);
      done();
    });
  }, 5);
}

module.exports = {
  users: users_by_tag,
  subjects: subjects_by_tag,
};
