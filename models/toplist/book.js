var central = require('../../lib/central');
var redis = central.redis;
var raven = central.raven;
var mongo = central.mongo;

var User = require(central.cwd + '/models/user');

var ONE_DAY = 60 * 60 * 24 * 1000;

function hardest_reader(period, cb) {
  var map = function() { emit(this.user_id, 1); };
  var reduce = function(k, vals) { return Array.sum(vals); };

  var query = { status: 'done' };

  period = period || 'all_time';

  var now = new Date();
  switch(period) {
    case 'this_year':
      query.updated = {
        $gt: new Date('' + now.getFullYear())
      };
      break;
    case 'last_year':
      query.updated = {
        $gt: new Date('' + now.getFullYear() - 1),
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
      coll.ensureIndex({ value: -1 }, { background: true }, function() {
        coll.find({}, { sort: { value: -1 }, limit: 50 }).toArray(function(err, ret) {
          cb(err, ret);
        });
      });
    });
  });
}
//hardest_reader = redis.cached.wrap(hardest_reader, 'hardest-readers-{0}', ONE_DAY)

module.exports = {
  hardest_reader: User.extended(hardest_reader)
};
