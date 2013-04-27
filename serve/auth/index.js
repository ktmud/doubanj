var passport = require(central.cwd + '/lib/passport');

var utils = require('./utils');

module.exports = function(app, central) {
  app.get('/login', function(req, res, next) {
    res.render('auth/login', { fields: req.query });
  });

  app.post('/login', utils.authenticate, function(req, res, next) {
    res.render('auth/login', {
      fields: req.body
    });
  });

  app.get('/auth/douban', passport.authenticate('douban'));

  app.get('/auth/douban/callback',
    passport.authenticate('douban', { failureRedirect: '/login' }),
    function(req, res, next) {
      res.redirect(req.query.redir || '/mine');
    });

};
