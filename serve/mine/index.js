module.exports = function(app, central) {

var utils = require('../utils');
var auth_utils = require('../auth/utils');

var KEY_CLICK_BOOK_SCORE = require('../../models/consts').KEY_CLICK_BOOK_SCORE;

var lodash = require('lodash');
var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');
var tasks = require(cwd + '/tasks');

app.get('/mine', auth_utils.require_login, function(req, res, next) {
  var user = req.user;
  if (!user.stats) {
    res.redirect(user.url());
  }

  var c = res.data = { user: user };

  user.data(KEY_CLICK_BOOK_SCORE, function(err, ret) {
    ret = ret || {};
    c.click_book_scores = ret;
    var user_ids = Object.keys(ret).sort(function(a, b) { return ret[b] - ret[a] });
    c.top_click_users = user_ids.slice(0, 4);
    next();
  });
}, function(req, res, next) {
  var c = res.data;
  var book_scores = c.click_book_scores;

  User.gets(c.top_click_users, function(err, users) {
    c.top_click_users = users.filter(function(a) { return a; });
    c.top_click_users.forEach(function(u, i) {
      u.book_score = book_scores[u.id];
    });
    next();
  });
}, function(req, res, next) {
  res.render('mine', res.data);
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
}, function(req, res, next) {
  req.user.listFollowings({
    limit: req.query.limit || 24,
    start: req.query.start
  }, function(err, result) {
    if (err) {
      res.statusCode = err.code || 200;
      return res.json({ r: err.code || 500, msg: err.message });
    }
    res.json({
      r: 0,
      items: result
    });
  });
});

};
