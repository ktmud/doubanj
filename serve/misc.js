
module.exports = function(app, central) {
  var User = require(central.cwd + '/models/user').User;

  app.get('/about', function(req, res, next) {
    User.count(function(err, n) {
      res.render('misc/about', {
        n_people: n
      });
    })
  });
  app.get('/about/click', function(req, res, next) {
    res.render('misc/about_click');
  });
  app.get('/about/privacy', function(req, res, next) {
    res.render('misc/about_privacy');
  });

  app.get('/donate', function(req, res, next) {
    res.render('misc/donate');
  });
};
