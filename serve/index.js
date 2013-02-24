function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var utils = require('./utils');

module.exports = function(app, central) {
  var tasks = require(central.cwd + '/tasks');

  app.post('/', function(req, res, next) {
    var uid = req.body.uid;

    if (!uid) res.redirec('/');

    tasks.interest.collect_book(uid);

    res.redirect('/user/' + uid + '/');
  });

  app.all('/*', utils.navbar);

  app.get('/', function(req, res, next) {
    res.render('index');
  });

  ['user', 'api'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
