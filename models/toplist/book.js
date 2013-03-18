var central = require('../../lib/central');
var redis = central.redis;
var raven = central.raven;
var mongo = central.mongo;

var User = require(central.cwd + '/models/user');

var ONE_DAY = 60 * 60 * 24 * 1000;

function generate_hardest_reader(period, cb) {
  var map = function() { emit(this.user_id, 1); };
  var reduce = function(k, vals) { return Array.sum(vals); };

  var query = { status: 'done' };

  period = period || 'all_time';

  var now = new Date();
  switch(period) {
    case 'this_year':
      query.updated = {
        $gte: new Date('' + now.getFullYear())
      };
      break;
    case 'last_year':
      query.updated = {
        $gte: new Date('' + (now.getFullYear() - 1)),
        $lt: new Date('' + now.getFullYear())
      };
      break;
    case 'last_12_month':
      query.updated = {
        $gt: new Date(now - ONE_DAY * 30.5 * 12),
      };
      break;
    default:
      break;
  }

  var out_coll = 'book_done_count_' + period;

  mongo(function(db) {
    db.collection('book_interest').mapReduce(map, reduce, {
      query: query,
      sort: { user_id: 1 },
      //out: { inline: 1 },
      out: { replace: out_coll },
    }, function(err, coll) {
      if (err) return cb(err, []);
      coll.ensureIndex({ value: -1 }, { background: true }, cb);
    });
  });
}

function hardest_reader(period, cb) {
  var out_coll = 'book_done_count_' + period;
  mongo(function(db) {
    db.collection(out_coll).find({}, { sort: { 'value': -1 }, limit: 10 }).toArray(function(err, res) {
      cb(err, res);
    });
  });
}
//hardest_reader = redis.cached.wrap(hardest_reader, 'hardest-readers-{0}', ONE_DAY)

module.exports = {
  generate_hardest_reader: generate_hardest_reader,
  hardest_reader: function(period, cb) {
    hardest_reader(period, function(err, ids) {
      User.gets(ids, { preserve_order: true, fields: { _id: 1, uid: 1, name: 1, avatar: 1 } }, function(err, users) {
        users = users.filter(function(item, i) {
          if (item) {
            item._count = ids[i].value;
            return item;
          }
          return false;
        });
        cb(err, users);
      });
    });
  }
};
