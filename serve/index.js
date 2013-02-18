function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var tasks = require(central.cwd + '/tasks');

module.exports = function(app, central) {
  app.post('/', function(req, res, next) {
    var uid = req.body.uid;

    tasks.interest.collect_book(uid);
    res.redirect('/');
  });

  app.get('/', function(req, res, next) {
    res.render('index');
  });

  ['api'].forEach(function(item) {
    require('./' + item)(app, central);
  });
};
