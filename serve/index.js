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
  app.post('/', function(req, res, next) {
    var uid = req.body.uid;
    if (!uid) res.redirec('/');
    res.redirect('/people/' + uid + '/');
  });

  app.post('/queue', function(req, res, next) {
    var uid = req.body.uid;

    if (!uid) res.redirec('/');
    var m = uid.match(reg_uid);
    if (m) uid = m[1];

    tasks.interest.collect_book({
      user: uid, 
      force: true,
      success: function(people) {
        tasks.compute({
          user: people,
          force: true
        });
      }
    });

    res.redirect('/people/' + uid + '/');
  });

  ['people', 'api'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
