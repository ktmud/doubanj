function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var utils = require('./utils');

var reg_uid = /\/people\/([^\/]+)/;

module.exports = function(app, central) {
  var tasks = require(central.cwd + '/tasks');

  app.all('/*', utils.navbar);

  app.get('/', function(req, res, next) {
    res.render('index');
  });

  app.post('/queue', function(req, res, next) {
    var uid = req.body.uid;

    if (!uid) res.redirec('/');
    var m = uid.match(reg_uid);
    if (m) uid = m[1];

    tasks.interest.collect_book(uid, function(user) {
      tasks.compute({
        user: user,
        force: true
      });
    });

    res.redirect('/user/' + uid + '/');
  });

  ['user', 'api'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
