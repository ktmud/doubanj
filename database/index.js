var assert = require('assert');
var debug = require('debug');
var log = debug('dbj');


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
    assert.equal(null, err);
    log('ensuring database "book_interest"...');
    r.ensureIndex({ 'id': 1 }, index_options, function(err, indexname) {
      if (err) return next(err);
      r.ensureIndex({ 'book_id': 1, 'user_id': 1, 'uid': 1 }, function(err, indexname) {
        if (err) return next(err);
        tick();
      });
    });
  });

  db.collection('book', function(err, r) {
    assert.equal(null, err);
    log('ensuring database "book"...');
    r.ensureIndex({ 'id': 1 }, index_options, function(err, indexname) {
      if (err) return next(err);
      r.ensureIndex({ 'author': 1, 'publisher': 1, 'isbn10': 1, 'isbn13': 1 }, function(err, indexname) {
        if (err) return next(err);
        tick();
      });
    });
  });

  db.collection('user', function(err, r) {
    assert.equal(null, err);
    log('ensuring database "users"...');
    r.ensureIndex({ 'uid': 1, 'id': 1 }, index_options, function(err, indexname) {
      if (err) return next(err);
      tick();
    });
  });

  var n = 3;
  function tick() {
    n--;
    if (n === 0) next(null, db);
  }
};
