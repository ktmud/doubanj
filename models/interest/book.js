var util = require('util');
var utils = central.utils;

var Interest = require('./base');
var BookSubject = require('../subject').book;


function BookInterest(info) {
  if (!(this instanceof BookInterest)) return new BookInterest(info);

  var self = this;

  if ('subject' in info) {
    info.subject = BookSubject(info.subject);
  }

  utils.extend(self, info);

  return this;
}
util.inherits(BookInterest, Interest);
utils.extend(BookInterest, Interest);

BookInterest.prototype.kind = BookInterest._collection = 'book_interest';
BookInterest.prototype.subject_type = 'book';
BookInterest.prototype.ns = 'book';

module.exports = BookInterest;
