/**
 * top users by tag
 */
module.exports = function(app, central) {

var debug = require('debug');
var error = debug('dbj:serve:tag:error');
var async = require('async');

var Subject = require(central.cwd + '/models/subject');
var User = require(central.cwd + '/models/user');
var toplist = require(central.cwd + '/models/toplist');

app.param('tagname', function(req, res, next, tagname) {
  var c = res.data = res.data || {};

  var query = req.query || {};

  c.tagname = tagname;

  function get_ids(obj_name, start, limit) {

    start = start || 0;
    limit = limit || 18;

    return function(callback) {
      toplist.tops_by_tag(tagname, obj_name, {
        start: start,
        limit: limit
      }, function(err, results) {
        c[obj_name + 's'] = results;
        callback(err);
      });
    }
  }

  async.parallel([
    get_ids('book', query.book_start),
    get_ids('book_done_user', query.user_start, 32)
  ], next);
}, function(req, res, next) {
  var c = res.data;

  function get_objects(context_val, cls) {
    return function(callback) {
      var ids = c[context_val]; 

      if (!ids) {
        c[context_val] = null;
        return callback();
      }

      cls.gets(ids, function(err, items) {
        items = items || [];
        items.forEach(function(item, i) {
          item._tag_count = ids[i].count;
        });

        // attach to the render context
        c[context_val] = items;

        callback(err);
      });
    }
  }

  async.parallel([
    get_objects('books', Subject.book),
    get_objects('book_done_users', User),
  ], next);
});

app.get('/tag/:tagname', function(req, res, next) {
  var c = res.data;

  c.referer = req.get('referer');

  if (!c.books) return next(404);
  res.render('tag', c);
});


};
