var central = require('../../lib/central');
var mongo = central.mongo;

var User = require('../user');

var redis = central.redis;
function hardest_reader(period, cb) {
  var out_coll = 'book_done_count_' + period;
  mongo(function(db) {
    db.collection(out_coll).find({}, {
      sort: { 'value': -1 },
      limit: 30
    }).toArray(function(err, res) {
      cb(err, res);
    });
  });
}

module.exports = {
  hardest_reader: function(period, cb) {
    hardest_reader(period, function(err, ids) {
      User.gets(ids, {
        preserve_order: true,
        fields: { _id: 1, uid: 1, name: 1, avatar: 1 }
      }, function(err, users) {
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
