
function mapreduce_hardest_reader(period, cb) {
  cb = cb || function(){};

  var map = function() { emit(this.user_id, 1); };
  var reduce = function(k, vals) { return Array.sum(vals); };

  // at least four words will be consider useful
  var query = { commented: { $gt: 3 } };

  period = period || 'all_time';

  var now = new Date();
  switch(period) {
    case 'last_30_days':
      query.updated = {
        $gte: new Date(now - ONE_MONTH)
      };
      break;
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
        $gt: new Date(now - ONE_MONTH * 12),
      };
      break;
    default:
      break;
  }

  var out_coll = 'book_done_count_' + period;

  mongo.queue(function(db, next) {
    db.collection('book_interest').mapReduce(map, reduce, {
      query: query,
      sort: { user_id: 1 },
      //out: { inline: 1 },
      out: { replace: out_coll },
    }, function(err, coll) {
      next();
      if (err) {
        error('Toplist failed: ', err)
        return cb(err);
      }
      log('Toplist for %s generated', out_coll);
      coll.ensureIndex({ value: -1 }, { background: true }, cb);
    });
  }, 5); // 5 means low priority
}

