var util = require('util');
var utils = central.utils;

var Subject = require('./base');

function Book(info) {
  if (!(this instanceof Book)) return new Book(info);

  var self = this;

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

Book.prototype.kind = Book._collection = 'book';

module.exports = Book;
