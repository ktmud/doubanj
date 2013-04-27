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
  }
};
