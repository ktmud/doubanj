var util = require('util');
var utils = central.utils;

var Subject = require('./base');

function Book(info) {
  if (!(this instanceof Book)) return new Book(info);

  var self = this;

  // fix douban img url
  if (info.images) {
    utils.forEach(info.images, function(item, key) {
      info.images[key] = utils.douimg(item)
    })
  }
  info.type = info.subject_type = 'book';

  utils.extend(self, info);

  Object.defineProperty(this, 'prop_keys', {
    value: Object.keys(info),
    enumerable: false
  });

  return this;
}
util.inherits(Book, Subject);
utils.extend(Book, Subject);

var gets = Book.gets;
Book.gets = function(ids, opts, cb) {
  if (typeof opts === 'object') {
    switch(opts.fields) {
    case 'simple':
      opts.fields = null;
      opts.fields = {
        title: 1,
        'images': 1,
        author: 1,
        publisher: 1,
        translator: 1,
        rated: 1,
      }
      break;
    }
  }
  gets.call(Book, ids, opts, cb);
};

Book.prototype.kind = Book._collection = 'book';

module.exports = Book;
