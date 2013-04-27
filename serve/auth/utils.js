var passport = require(central.cwd + '/lib/passport');

module.exports = {
  authenticate: function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      req.auth_error = err;
      req.user = user;
      return next();
    })(req, res, next);
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
