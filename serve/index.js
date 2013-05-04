var utils = require('./utils');

module.exports = function(app, central) {

  var User = require(central.cwd + '/models/user');

  app.use(utils.navbar);

  app.get('/', function(req, res, next) {
    var uid = req.query.q;
    if (uid) {
      uid = utils.url2uid(uid);
      if (!uid) return res.redirect('/');

      req.uid = uid;

      if (req.user && req.user.uid != uid) {
        User.getFromMongo(uid, function(err, user) {
          // 已经有统计结果，直接到契合指数页面
          if (user && user.book_stats) {
            return res.redirect(req.user.url() + 'click/' + user.uid);
          }
          next();
        });
        return;
      }
    }
    next();
  }, function(req, res, next) {
    if (req.uid) return res.redirect('/people/' + req.uid + '/');
    res.render('index');
  });

  app.post('/', function(req, res, next) {
    var uid = utils.url2uid(req.body.uid);
    if (!uid) return res.redirect('/');
    res.redirect('/people/' + uid + '/');
  });

  ['people', 'api', 'misc', 'top', 'mine', 'queue', 'auth', 'tag', 'monitor'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
