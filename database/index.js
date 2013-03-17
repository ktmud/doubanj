var assert = require('assert');
var debug = require('debug');
var log = debug('dbj:database');


// unique key index option
var index_options = {
  unique: true,
  background: true,
  dropDups: true,
  w: 1
};
var sparse_option = {
  sparse: 1,
  background: true,
};

module.exports = function(db, next) {
  db.collection('book_interest', function(err, r) {
    log('ensuring database "book_interest"...');
    var n = 4;
    function _tick(err, r) {
      n--;
      if (err) console.error(err);
      if (n <= 0) tick();
    }
    //r.ensureIndex({ 'id': 1 }, index_options, _tick);
    r.ensureIndex({ 'user_id': 1, 'status': 1, 'commented': -1, }, sparse_option, _tick);
    r.ensureIndex({ 'user_id': 1, 'status': 1, 'updated': -1, }, sparse_option, _tick);
    r.ensureIndex({ 'user_id': 1, 'updated': -1, 'status': 1 }, sparse_option, _tick);
    r.ensureIndex({ 'user_id': 1, 'status': 1, 'rating.value': -1, }, sparse_option, _tick);
  });

  db.collection('book', function(err, r) {
    log('ensuring database "book"...');
    var n = 5;
    function _tick(err, r) {
      n--;
      if (err) console.error(err);
      if (n <= 0) tick();
    }

    //r.ensureIndex({ 'id': 1 }, index_options, _tick);
    r.ensureIndex({ 'raters': -1 }, sparse_option, _tick);
    r.ensureIndex({ 'rated': -1 }, sparse_option, _tick);
    r.ensureIndex({ 'pages': -1 }, sparse_option, _tick); 
    r.ensureIndex({ 'price': -1 }, sparse_option, _tick);
    r.ensureIndex({ 'pubdate': -1 }, sparse_option, _tick);
  });

  db.collection('user', function(err, r) {
    log('ensuring database "users"...');
    var n = 2;
    function _tick(err, r) {
      n--;
      if (err) console.error(err);
      if (n <= 0) tick();
    }
    //r.ensureIndex({ 'id': 1 }, index_options, _tick);
    r.ensureIndex({ 'uid': 1 }, index_options, _tick); 
    r.ensureIndex({ 'last_statsed': 1 }, sparse_option, _tick);
    //r.ensureIndex({ 'mtime': 1 }, _tick); 
  });

  var n = 3;
  function tick() {
    n--;
    if (n === 0) next(null, db);
  }
};
