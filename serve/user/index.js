var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest').Interest;

module.exports = function(app, central) {
  app.get(/^\/user\/\w+$/, function(req, res, next) {
    return res.redirect(301, req._parsedUrl.path + '/');
  });
  app.get(/^\/user\/(\w+)\/.*$/, function(req, res, next) {
    var uid = req.params.uid;

    var c = {
      stage: 'nothing',
      qs: req.query
    };

    User.get(uid, function(err, user) {
      c.err = err;
      c.user = user;

      if (!user || !user._id) {
        return res.render('user/404', c);
      }
      res.data = c;
      next();
    });
  });

  app.get('/user/:uid/', function(req, res, next) {
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
