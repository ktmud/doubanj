var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest').Interest;

var utils = require('../utils');

module.exports = function(app, central) {
  var tasks = require(central.cwd + '/tasks');

  app.get(/^(\/api)?\/people\/[^\/]+$/, function(req, res, next) {
    return res.redirect(301, req._parsedUrl.pathname + '/');
  });
  app.get(/^(\/api)?\/people\/([^\/]+)\/?.*$/, utils.getUser({
    fn: function(req) { return req.params[1]; }
  }), function(req, res, next) {
    var uid = req.params[1]; 

    var people = res.data && res.data.people;

    var err = res.data && res.data.err;
    if (!people || people.invalid == 'NO_USER') {
      res.statusCode = err ? 500 : 404;
      res.data.err = res.data.err || res.statusCode;
      return res.render('people/failed', res.data);
    }
    if (uid === people.id && people.uid && people.uid !== people.id) {
      return res.redirect(301, '/people/' + people.uid + '/');
    }

    res.data.name = people.name || people.uid

    next();
  });

  app.get('/people/:uid/', function(req, res, next) {
    var people = res.data.people;
    var sleep = false;
    var recount = 'recount' in req.query;
    if ((!people.stats_p && people.last_synced_status === 'succeed') || recount) {
      //try compute the results
      tasks.compute({
        user: people,
        force: recount
      });
      sleep = true;
    }
    setTimeout(function() {
      if (recount) {
        res.redirect(req._parsedUrl.pathname);
      } else {
        next();
      }
    }, sleep ? 100 : 0);
  }, function(req, res, next) {

    res.data.istatus = null;

    var people = res.data.people;

    if (!people.stats) return res.render('people', res.data);

    Interest.findByUser('book', people.uid, { limit: 7 }, function(err, ilist) {

      res.data.latest_interests = ilist;

      res.render('people', res.data);
    });
  }); 

  var availables = {
    'read': {
      'ns': 'book',
      'name': '读过的书',
      'status': 'done'
    },
    'wish': {
      'ns': 'book',
      'name': '想读的书',
      'status': 'done'
    }
  };

  app.get('/people/:uid/:istatus', function(req, res, next) {
    var istatus = req.params.istatus;

    if (istatus == 'all') {
      return res.redirect('/people/' + req.params.uid + '/');
    } else if (istatus in availables) {
      istatus = res.data.istatus = availables[istatus];
    } else {
      return next(404);
    }

    var people = res.data.people;

    res.data.title = people.name + istatus.name;

    if (people.notReady()) {
      return res.redirect('/people/' + req.params.uid + '/');
    }

    res.render('people/sub', res.data);
  });

  app.get('/people/:uid/books', function(req, res, next) {
    var people = res.data.people;
    var start = req.query.start || 0;
    var count = 20;
    Interest.findByUser('book', people.uid, {
      start: start,
      count: count
    }, function(err, data) {
      var c = res.data;
      c.err = err;
      c.ns_name = '读书';
      c.interests = {
        book: data
      };
      res.render('people/interests', c);
    });
  });

};
