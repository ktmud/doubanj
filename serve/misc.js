
module.exports = function(app, central) {
  app.get('/about', function(req, res, next) {
    res.render('misc/about');
  });
};
