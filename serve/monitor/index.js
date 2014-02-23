module.exports = function(app, central) {

var auth_utils = require('../auth/utils')
var tasks = require('../../tasks')
var async = require('async')

var mongo = central.mongo
var ONE_HOUR = 60 * 60 * 1000

app.get('/monitor', auth_utils.require_admin, function(req, res, next) {
  var c = {
    get_queue: tasks.getQueue
  }
  mongo(function(db) {
    var col_user = db.collection('user')
    async.parallel([
      function(callback) {
        col_user.count(callback)
      },
      function(callback) {
        col_user.count({ last_synced_status: 'succeed' }, callback)
      },
      function(callback) {
        col_user.count({
          last_synced_status: 'ing',
        }, callback)
      },
      function(callback) {
        col_user.find({
          last_synced_status: { $ne: 'succeed' },
          last_synced: { $lt: new Date(new Date() - ONE_HOUR) },
        }).toArray(callback)
      },
      function(callback) {
        db.collection('book').count(callback)
      },
      function(callback) {
        db.collection('book_interest').count(callback)
      }
    ],
    function(err, results) {
      c.err = err
      c.total = results[0]
      c.n_succeed = results[1]
      c.n_ing = results[2]
      c.timeouted = results[3]
      c.n_book = results[4]
      c.n_book_interest = results[5]
      res.render('monitor', c)
    })
  })
})


}
