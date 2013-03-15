var assert = require('assert');
var debug = require('debug');
var log = debug('dbj:database');


// unique key index option
var index_options = {
  unique: true,
  sparse: true,
  background: true,
  dropDups: true,
  w: 1
};

module.exports = function(db, next) {
  db.collection('book_interest', function(err, r) {
    log('ensuring database "book_interest"...');
    r.ensureIndex({ 'id': 1 }, index_options, function(err, indexname) {
      if (err) return next(err);
      r.ensureIndex({ 'user_id': 1 }, function(err, indexname) {
        if (err) return next(err);
        tick();
      });
    });
  });

  db.collection('book', function(err, r) {
    log('ensuring database "book"...');
    r.ensureIndex({ 'id': 1 }, index_options, function(err, indexname) {
      if (err) return next(err);

      var n = 5;
      function _tick() {
        n--;
        if (n <= 0) tick();
      }
      r.ensureIndex({ 'pages': 1 }, _tick); 
      r.ensureIndex({ 'price': 1 }, _tick);
      r.ensureIndex({ 'raters': 1 }, _tick);
      r.ensureIndex({ 'rated': 1 }, _tick);
      r.ensureIndex({ 'pubdate': 1 }, _tick);
    });
  });

  db.collection('user', function(err, r) {
    log('ensuring database "users"...');
    r.ensureIndex({ 'id': 1 }, index_options, function(err, indexname) {
      if (err) return next(err);

      var n = 3;
      function _tick() {
        n--;
        if (n <= 0) tick();
      }
      r.ensureIndex({ 'uid': 1 }, _tick); 
      r.ensureIndex({ 'mtime': 1 }, _tick); 
      r.ensureIndex({ 'last_statsed': 1 }, _tick);
    });
  });

  var n = 3;
  function tick() {
    n--;
    if (n === 0) next(null, db);
  }
};
