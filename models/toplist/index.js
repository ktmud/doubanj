exports.getToplistKey = function(namespace, period) {
  return namespace + '_done_count_' + period
}

exports.tops_by_tag = function tops_by_tag(tagname, obj_name, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  options = options || {}

  var start = options.start || 0
  var limit = options.limit || 24

  central.mongo(function(db) {
    db.collection(['top', obj_name, 'by_tag'].join('_'))
      .find({ tagname: tagname }, {
        sort: { count: -1 },
        fields: { count: 1 },
        limit: limit,
        skip: start
      }).toArray(function(err, results) {
        if (err) return cb(err)

        results.forEach(function(item) {
          var tmp = item._id.split('::')
          item._id = tmp[0]
          // 在自身所有标签里的排名
          item.self_order = tmp[1]
        })

        return cb(err, results)
      })
  })
}

exports.book = require('./book')
