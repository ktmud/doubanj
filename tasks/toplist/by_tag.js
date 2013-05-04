var central = require('../../lib/central');
var mongo = central.mongo;

var debug = require('debug');
var log = debug('dbj:toplist:by_tag:log');
var verbose = debug('dbj:toplist:by_tag:verbose');
var error = debug('dbj:toplist:by_tag:error');

// reduce to top 100 subjects
//var reduce = function(tag, vals) { 
  //vals = Array.prototype.concat.apply([], vals);
  //vals = vals.sort(function(a, b) {
    //return b.count - a.count;
  //}).slice(0, 100);

  //return vals;
//};

var noop = function(){};

function users_by_tag(ns, status, done) {
  done = done || function(){};

  if (!ns || !status) return done(new Error('Namespace and status needed'));
  
  var stats_status = status || 'all';
  
  var out_coll = ['top', ns, status, 'user_by_tag'].join('_');

  mongo.queue(function(db, next) {

    log('[%s] started...', out_coll);

    var query = { last_synced_status: 'succeed' };

    // 至少总共读过50本书才可能进榜吧
    // { book_stats.done.total: { $gt: 50 } }
    query[ns + '_n'] = { $gt: 50 };

    var stream = db.collection('user').find(query).stream();

    var out_collection = db.collection(out_coll);


    out_collection.ensureIndex({ tagname: 1, count: 1 }, { background: true }, noop);

    function update_tags_coll(user_id, top_tags){
      top_tags.forEach(function(item, i) {
        out_collection.update({ _id: user_id + '::' + i }, {
          $set: { tagname: item._id, count: item.count }
        }, { upsert: true, w: -1 });
      });
    }

    stream.on('data', function(doc) {
      if (!doc[ns + '_stats']) return;
      var result = doc[ns + '_stats'][stats_status];
      var top_tags = result && result.top_tags;

      if (top_tags) {
        update_tags_coll(doc._id, top_tags);
      }
    });

    stream.on('error', function(err) {
      next();
      error('[%s] failed: ', out_coll, err)
      done(err);
    });

    stream.on('close', function(err) {
      next();
      log('[%s] generated.', out_coll);
      done();
    });
  }, 4);
}

function subjects_by_tag(ns, done) {
  done = done || function(){};

  if (!ns) return done(new Error('Namespace needed'));
  
  var out_coll = ['top', ns, 'by_tag'].join('_');

  mongo.queue(function(db, next) {

    log('[%s] started...', out_coll);

    // 至少有十个人打分的图书才有可能进入热门榜吧
    var query = {
      'raters': { $gt: 10 }
    };

    var stream = db.collection(ns).find(query).stream();

    var out_collection = db.collection(out_coll);

    out_collection.ensureIndex({ tagname: 1, count: 1 }, { background: true }, noop);

    function update_tags_coll(subject_id, top_tags){
      top_tags.forEach(function(item, i) {
        out_collection.update({ _id: subject_id + '::' + i }, {
          // 豆瓣API返回的 tag 格式为
          // { name: 'xxx', title: 'xxx', count: 10 }
          $set: { tagname: item.name, count: item.count }
        }, { upsert: true, w: -1 });
      });
    }

    stream.on('data', function(doc) {
      if (!doc.tags) return;
      update_tags_coll(doc._id, doc.tags);
    });

    stream.on('error', function(err) {
      next();
      error('[%s] failed: ', out_coll)
      done(err);
    });

    stream.on('close', function(err) {
      next();
      log('[%s] generated.', out_coll);
      done();
    });
  }, 4);
}

module.exports = {
  users: users_by_tag,
  subjects: subjects_by_tag,
};
