module.exports = function(app, central) {

var utils = require('../utils');
var auth_utils = require('../auth/utils');

var KEY_CLICK_BOOK_SCORE = require('../../models/consts').KEY_CLICK_BOOK_SCORE;

var lodash = require('lodash');
var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');
var tasks = require(cwd + '/tasks');

function get_click_book_scores(req, res, next) {
  var c = res.data = res.data || {};
  var user = c.user = req.user;

  user.data(KEY_CLICK_BOOK_SCORE, function(err, ret) {
    ret = ret || {};
    c.click_book_scores = ret;
    next();
  });
}

app.get('/mine', auth_utils.require_login,
  function(req, res, next) {
    var user = req.user;
    if (!user.stats) {
      res.redirect(user.url());
    }
    next();
  },
  get_click_book_scores,
  function(req, res, next) {
    var c = res.data;
    var book_scores = c.click_book_scores;

    var user_ids = Object.keys(book_scores).sort(function(a, b) { return book_scores[b] - book_scores[a] });
    user_ids = user_ids.slice(0, 4);

    User.gets(user_ids, function(err, users) {

      c.top_click_users = users.filter(function(u) {
        if (!u) return false;

        u.book_score = book_scores[u.id];

        return true;
      });

      res.render('mine', c);
    });
  });

var rj = auth_utils.require_login_json; 

app.get('/api/mine/followings', rj, function(req, res, next) {
  if (!req.user) {
    res.statusCode = 401;
    res.json({ r: 401 });
    return;
  }
  req.query = req.query || {};

  if (req.query.fresh) {
    req.user.clearFollowings(next);
    return;
  }
  return next();
},
get_click_book_scores,
function(req, res, next) {
  req.user.listFollowings({
    limit: req.query.limit || 24,
    start: req.query.start
  }, function(err, result) {
    if (err) {
      res.statusCode = err.code || 200;
      return res.json({ r: err.code || 500, msg: err.message });
    }

    var all_scores = res.data.click_book_scores;

    result.forEach(function(item) {
      item.ready = (item.stats_p == 100);
      item.ing = item.last_synced_status === 'ing';
      item.score = all_scores[item.id];
    });

    res.json({
      r: 0,
      items: result
    });
  });
});

};
