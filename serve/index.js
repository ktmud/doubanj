function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var cwd = process.cwd();
var tasks = require(cwd + '/tasks');
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest').Interest;

module.exports = function(app, central) {
  app.post('/', function(req, res, next) {
    var uid = req.body.uid;

    if (!uid) res.redirec('/');

    tasks.interest.collect_book(uid);

    res.redirect('/?uid=' + uid);
  });

  app.get('/', function(req, res, next) {
    var uid = req.query.uid;

    var c = {
      stage: 'nothing',
      qs: req.query
    };
    if (uid) {
      User.get(uid, function(err, user) {
        if (!user || !user._id) {
          c.stage = 'getting user';
          return res.render('list', c);
        }

        c.user = user;

        Interest.findByUser('book', user.uid, function(err, data) {
          c.err = err;
          c.interests = {
            book: data
          };
          res.render('list', c);
        }, {
          reversed: true,
          attach_subject: true
        });
      });
      return;
    }
    res.render('index', c);
  });

  ['api'].forEach(function(item) {
    require('./' + item)(app, central);
  });
};
