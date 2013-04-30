var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');
var tasks = require(cwd + '/tasks');

var utils = require('../utils');
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

var rj = auth_utils.require_login_json; 

app.get('/api/mine/followings', rj, function(req, res, next) {
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


app.get('/api/mine/click/:uid', rj, utils.getUser({ redir: false }), function(req, res, next) {
  var a = req.user, b = res.data.people;

  a.getClick(b, function(err, r) {
    if (err) return res.json({ r: 500, msg: '获取数据失败' });
    if (r === null || typeof r !== 'object' || r.retry_count > 10) {
      r = { p: 10 };
      a.setClick(b, r, function() {
        tasks.click.book({ users: [a, b] });
      });
    }
    if (r.p !== 100) {
      r.retry_count = r.retry_count || 0; 
      r.retry_count += 1;
      r.p += 5;
      a.setClick(b, r);
    }

    var result;
    if (r.ratios) {
      result = {
        b_name: b.name,
        a: a.uid,
        b: b.uid,
        index: r.index,
        reliability: r.reliability
      };
    } else {
      result = {
        error: r.error
      };
    }

    res.json({
      r: 0,
      p: r.p,
      result: result
    });
  });
});

};
