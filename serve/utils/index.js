var cwd = central.cwd;
var User = require(cwd + '/models/user').User;

var reg_uid = /\/people\/([^\/]+)/;

function matchPeople(req) {
  var uid = req.body.uid || req.query.uid || req.params.uid;

  var m = uid.match(reg_uid);
  if (m) uid = m[1];

  return uid;
}

module.exports = {
  errorHandler: require('./errorHandler'),
  getUser: function(opts) {
    opts = opts || {};
    var redir = opts.redir;
    var fn = opts.fn || matchPeople;
    return function(req, res, next) {
      var uid = fn(req);
      var c = res.data = {
        qs: req.query,
        uid: uid
      };

      if (!uid) {
        if (redir) {
          if (typeof redir === 'function') redir = redir(req);
          return res.redirect(redir);
        }
        return next();
      }

      User.get(uid, function(err, people) {
        c.err = err;
        c.people = people;
        next();
      });
    };
  },
  navbar: function navbar(req, res, next) {
    var links = [{
      href: central.conf.site_root,
      active: req.url === '/',
      text: '首页'
    }];
    if (req.user) {
      links.push({
        href: '/user/' + req.user.uid,
        text: '我的'
      });
    }
    res.locals.navbar_links = links;
    next();
  }
};

