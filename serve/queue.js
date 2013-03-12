var utils = require('./utils');


module.exports = function(app, central) {
  var tasks = require(central.cwd + '/tasks');

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

    var fresh = 'fresh' in req.body;

    tasks.interest.collect_book({
      user: user, 
      // to start a sync discard of running states
      force: 'force' in req.body,
      fresh: fresh,
    });

    var fn = fresh ? 'reset' : 'markSync';
    user[fn](function() {
      res.redirect('/people/' + uid + '/');
    });
  });
};

