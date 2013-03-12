function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var utils = require('./utils');

module.exports = function(app, central) {
  app.all('/*', utils.navbar);

  app.get('/', function(req, res, next) {
    res.render('index');
  });
  app.post('/', function(req, res, next) {
    var uid = utils.url2uid(req.body.uid);
    if (!uid) res.redirect('/');
    res.redirect('/people/' + uid + '/');
  });

  ['queue', 'people', 'api', 'misc'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  //var raven = require('raven');
  //app.use(raven.middleware.express(central.raven.client));
  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
