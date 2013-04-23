var utils = require('./utils');

module.exports = function(app, central) {
  app.all('/*', utils.navbar);

  app.get('/', function(req, res, next) {
    var uid = req.query.q;
    if (uid) {
      uid = utils.url2uid(uid);
      if (uid) {
        return res.redirect('/people/' + uid + '/');
      } else {
        return res.redirect('/');
      }
    }
    res.render('index');
  });
  app.post('/', function(req, res, next) {
    var uid = utils.url2uid(req.body.uid);
    if (!uid) return res.redirect('/');
    res.redirect('/people/' + uid + '/');
  });

  ['people', 'api', 'misc', 'top', 'auth', 'queue'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  //var raven = require('raven');
  //app.use(raven.middleware.express(central.raven.client));
  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
