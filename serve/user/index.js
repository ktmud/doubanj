var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest').Interest;

module.exports = function(app, central) {
  app.get(/^\/user\/\w+$/, function(req, res, next) {
    return res.redirect(301, req._parsedUrl.path + '/');
  });
  app.get(/^\/user\/(\w+)\/.*$/, function(req, res, next) {
    var uid = req.params[0];

    var c = {
      stage: 'nothing',
      qs: req.query
    };

    if (!uid) return next();

    User.get(uid, function(err, user) {
      c.err = err;
      c.user = user;
      res.data = c;

      if (user && uid === user.id && user.uid) {
        return res.redirect(301, '/user/' + user.uid + '/');
      }
      next();
    });
  });

  app.get('/user/:uid/', function(req, res, next) {
    if (!res.data || !res.data.user || res.data.user.invalid == 'NO_USER') {
      res.statusCode = 404;
      return res.render('user/404');
    }
    res.render('user', res.data);
  }); 

  app.get('/user/:uid/list', function(req, res, next) {
    Interest.findByUser('book', user.uid, function(err, data) {
      c.err = err;
      c.interests = {
        book: data
      };
      res.render('user', c);
    }, {
      reversed: true,
      attach_subject: true
    });
  });
};
