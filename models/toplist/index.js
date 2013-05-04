
function tops_by_tag(tagname, obj_name, cb) {
  central.mongo(function(db) {
    db.collection(['top', obj_name, 'by_tag'].join('_'))
      .findOne({ _id: tagname }, cb);
  });
}

module.exports = {
  tops_by_tag: tops_by_tag,
  book: require('./book')
};
