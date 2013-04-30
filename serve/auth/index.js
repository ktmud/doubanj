var passport = require(central.cwd + '/lib/passport');

var utils = require('./utils');

module.exports = function(app, central) {
  app.get('/login', function(req, res, next) {
    req.session.redir = req.query.redir;
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
      res.redirect(req.session.redir || '/mine');
    });

  app.get('/logout', function(req, res, next) {
    delete req.session.passport;
    delete req.session.user_id;
    var refer = req.get('Referer');
    return res.redirect(refer || '/login');
  });
};
