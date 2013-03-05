var cwd = central.cwd;
var User = require(cwd + '/models/user').User;

var reg_uid = /\/people\/([^\/]+)/;

function url2uid(url) {
  var m = url.match(reg_uid);
  if (m) uid = m[1];
  return m && m[1] || url;

}
function matchPeople(req) {
  var uid = req.body.uid || req.query.uid || req.params.uid;
  return url2uid(uid);
}

module.exports = {
  errorHandler: require('./errorHandler'),
  url2uid: url2uid,
  getUser: function(opts) {
    opts = opts || {};
    var redir = opts.redir;
    var fn = opts.fn || matchPeople;
    return function(req, res, next) {
      var uid = fn(req);
      var c = res.data = {
        qs: req.query,
        title: uid + '的豆瓣酱',
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
        if (people) c.title = people.name + '的豆瓣酱';
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

