var passport = require('passport');

module.exports = function(app, central) {
  app.get('/mine', function(req, res, next) {
    if (!req.user) {
      return req.redirect('/login?redir=mine');
    }
  });
  app.post('/auth/login', function(req, res, next) {
  });
  app.get('/auth/login', function(req, res, next) {
  });
};
