var passport = require(central.cwd + '/lib/passport');

var admin_users = central.conf.admin_users;

module.exports = {
  authenticate: function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      req.auth_error = err;
      req.user = user;
      return next();
    })(req, res, next);
  },
  require_admin: function(req, res, next) {
    if (!req.user) return next(404);
    if (admin_users.indexOf(req.user.uid) === -1) return next(404);
    return next();
  },
  require_login: function(req, res, next) {
    if (!req.user) {
      return res.redirect('/login?redir=' + encodeURIComponent(req.url));
    }
    next();
  },
  require_login_json: function(req, res, next) {
    if (!req.user) {
      res.statusCode = 401;
      return res.json({ r: 401, msg: '登录已超时，请重新登录' });
    }
    next();
  }
};
