function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var utils = require('./utils');

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

  app.post('/queue', utils.getUser({
    redir: '/',
  }), function(req, res, next) {
    var uid = res.data.uid;
    var user = res.data.people;

    if (!user) {
      res.redirect('/people/' + uid + '/');
      return;
    }

    var uid = user.uid || user.id;

    tasks.interest.collect_book({
      user: user, 
      force: true,
      success: function(people) {
        tasks.compute({
          user: people,
          force: true
        });
      }
    });

    user.update({
      book_n: 999999,
      last_synced_status: 'ing'
    }, function() {
      res.redirect('/people/' + uid + '/');
    });
  });

  ['people', 'api'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
