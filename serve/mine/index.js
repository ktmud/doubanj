var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');

var auth_utils = require('../auth/utils');

module.exports = function(app, central) {

app.get('/mine', auth_utils.require_login, function(req, res, next) {
  var people = req.user;
  if (!people.stats) {
    res.redirect(people.url());
  }
  res.render('mine', {
    people: req.user
  });
});

app.get('/api/mine/followings', auth_utils.require_login_json, function(req, res, next) {
  var people = req.user;
  if (!people) {
    res.statusCode = 404;
    res.json({ r: 404 });
    return;
  }

  people.listFollowings({
    limit: 24,
    start: req.query && req.query.start
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
