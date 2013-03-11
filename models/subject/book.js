var util = require('util');
var utils = central.utils;

var Subject = require('./base');

function Book(info) {
  if (!(this instanceof Book)) return new Book(info);

  var self = this;

  info.type = info.subject_type = 'book';
  utils.extend(self, info);

  this.prop_keys = Object.keys(info);

  return this;
}
util.inherits(Book, Subject);
utils.extend(Book, Subject);

Book.prototype.kind = Book._collection = 'book';

module.exports = Book;

